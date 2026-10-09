import { NextRequest, NextResponse } from 'next/server'
import { db, opsAuthorized, draftEmail, fillLinkedIn, today } from '../../../ops/lib'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const NEW_SEQUENCES_PER_RUN = 5
const DRAFTS_PER_RUN = 15

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronOk = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`
  if (!cronOk && !opsAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = db()
    const day = today()
    const summary: any = { started: 0, drafted: 0, failed: 0, unblocked: 0, skipped: 0 }

    // 0. If Apo reference is approved, unblock E3 touches
    const { data: apo } = await supabase
      .from('rr_settings')
      .select('value')
      .eq('key', 'apo_reference_approved')
      .maybeSingle()
    if (apo?.value === 'true') {
      const { data: unblocked } = await supabase
        .from('rr_touches')
        .update({ status: 'pending' })
        .eq('code', 'E3')
        .eq('status', 'blocked')
        .select('id')
      summary.unblocked = unblocked?.length || 0
    }

    // 1. Start sequences for new contacts at scoring accounts (a few per day)
    const { data: fresh } = await supabase
      .from('rr_contacts')
      .select('id, rr_accounts!inner(route)')
      .eq('status', 'new')
      .not('email', 'is', null)
      .in('rr_accounts.route', ['full_sequence', 'standard_sequence'])
      .limit(NEW_SEQUENCES_PER_RUN)

    for (const c of fresh || []) {
      const { error } = await supabase.rpc('rr_start_sequence', {
        p_contact: (c as any).id,
        p_start: day,
      })
      if (!error) summary.started += 1
    }

    // 2. Draft touches that are due
    const { data: due } = await supabase
      .from('rr_touches')
      .select(
        'id, code, channel, rr_contacts(id, first_name, last_name, title, email, status, rr_accounts(name, country, category))'
      )
      .eq('status', 'pending')
      .lte('scheduled_for', day)
      .order('scheduled_for')
      .limit(DRAFTS_PER_RUN)

    await Promise.all(
      (due || []).map(async (t: any) => {
        const contact = t.rr_contacts
        const account = contact?.rr_accounts
        if (!contact || !['new', 'sequencing'].includes(contact.status)) {
          await supabase.from('rr_touches').update({ status: 'skipped' }).eq('id', t.id)
          summary.skipped += 1
          return
        }
        try {
          if (t.channel === 'linkedin') {
            const body = fillLinkedIn(t.code, contact, account)
            await supabase.from('rr_touches').update({ status: 'drafted', body }).eq('id', t.id)
          } else {
            const d = await draftEmail(t.code, contact, account)
            await supabase
              .from('rr_touches')
              .update({ status: 'drafted', subject: d.subject, body: d.body })
              .eq('id', t.id)
          }
          summary.drafted += 1
        } catch (e) {
          summary.failed += 1
        }
      })
    )

    // 3. Optional morning digest email to the founder (free Resend account)
    const { count: waiting } = await supabase
      .from('rr_touches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'drafted')
    summary.waiting = waiting || 0

    if (process.env.RESEND_API_KEY && process.env.FOUNDER_EMAIL && (waiting || 0) > 0) {
      const base = process.env.OPS_URL || 'https://receiptraffle-ygef.vercel.app'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Receiptraffle Ops <onboarding@resend.dev>',
          to: [process.env.FOUNDER_EMAIL],
          subject: `${waiting} outreach touches waiting for you`,
          text: `Good morning. ${waiting} drafts are ready to review and send.\n\nOpen: ${base}/ops`,
        }),
      }).catch(() => null)
    }

    return NextResponse.json({ ok: true, ...summary })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Cron failed' }, { status: 500 })
  }
}
