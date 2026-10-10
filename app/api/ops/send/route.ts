import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db, opsAuthorized, senderName } from '../../../ops/lib'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!opsAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (process.env.SEND_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Sending is switched off. Set SEND_ENABLED=true in Vercel and redeploy.' },
        { status: 400 }
      )
    }
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    if (!user || !pass) {
      return NextResponse.json({ error: 'SMTP_USER or SMTP_PASS is missing in Vercel.' }, { status: 400 })
    }

    const { id, subject, body } = await req.json()
    const supabase = db()

    const { data: t } = await supabase
      .from('rr_touches')
      .select('id, code, channel, status, subject, body, contact_id')
      .eq('id', id)
      .maybeSingle()
    if (!t) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    if (t.channel !== 'email') {
      return NextResponse.json({ error: 'Only email touches can be sent from here' }, { status: 400 })
    }
    if (t.status !== 'drafted') {
      return NextResponse.json({ error: 'Only drafted emails can be sent' }, { status: 400 })
    }

    const { data: c } = await supabase
      .from('rr_contacts')
      .select('id, email, status')
      .eq('id', t.contact_id)
      .maybeSingle()
    if (!c?.email) return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 })
    if (!['new', 'sequencing'].includes(c.status)) {
      return NextResponse.json({ error: 'Contact is no longer in a sequence' }, { status: 400 })
    }

    const { data: suppressed } = await supabase
      .from('rr_suppression')
      .select('id')
      .ilike('email', c.email)
      .limit(1)
    if (suppressed && suppressed.length > 0) {
      return NextResponse.json({ error: 'This address is on the suppression list' }, { status: 400 })
    }

    // Daily cap (protects the mailbox reputation)
    const cap = parseInt(process.env.DAILY_SEND_CAP || '20', 10)
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)
    const { count: sentToday } = await supabase
      .from('rr_touches')
      .select('id', { count: 'exact', head: true })
      .eq('channel', 'email')
      .eq('status', 'sent')
      .gte('sent_at', startOfDay.toISOString())
    if ((sentToday || 0) >= cap) {
      return NextResponse.json(
        { error: `Daily send cap reached (${cap}). Try again tomorrow, or raise DAILY_SEND_CAP in Vercel.` },
        { status: 429 }
      )
    }

    const finalSubject = (subject ?? t.subject ?? '').toString().trim()
    const finalBody = (body ?? t.body ?? '').toString().trim()
    if (!finalSubject || !finalBody) {
      return NextResponse.json({ error: 'Subject and body must not be empty' }, { status: 400 })
    }

    const port = parseInt(process.env.SMTP_PORT || '465', 10)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    try {
      const info = await transporter.sendMail({
        from: `"${senderName()}" <${user}>`,
        to: c.email,
        replyTo: user,
        subject: finalSubject,
        text: finalBody,
        headers: { 'List-Unsubscribe': `<mailto:${user}?subject=stop>` },
      })

      await supabase
        .from('rr_touches')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          subject: finalSubject,
          body: finalBody,
          message_id: info.messageId || null,
          send_error: null,
        })
        .eq('id', t.id)

      return NextResponse.json({ ok: true, to: c.email, sentToday: (sentToday || 0) + 1, cap })
    } catch (e: any) {
      await supabase.from('rr_touches').update({ send_error: String(e?.message || e).slice(0, 300) }).eq('id', t.id)
      return NextResponse.json({ error: 'Mail server said: ' + (e?.message || 'send failed') }, { status: 502 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 })
  }
}
