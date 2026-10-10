import { NextRequest, NextResponse } from 'next/server'
import { db, opsAuthorized, draftEmail, fillLinkedIn, today } from '../../../ops/lib'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const NEW_SEQUENCES_PER_RUN = 5
const NEW_ROUTING_PER_RUN = 8
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
    let host = ''
    try {
      host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host
    } catch (e) {
      host = 'invalid url'
    }
    const summary: any = {
      day,
      routing: 0,
      started: 0,
      drafted: 0,
      failed: 0,
      unblocked: 0,
      skipped: 0,
      dueFound: 0,
      dueCodes: [] as string[],
      host: '',
      errors: [] as string[],
    }

    // 0. If the Apo reference is approved, unblock E3 touches
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

    // 1a. Routing track: generic inboxes get a "who is the right person" email
    const { data: inboxes, error: inboxErr } = await supabase
      .from('rr_contacts')
      .select('id')
      .eq('status', 'new')
      .eq('persona', 'generic_inbox')
      .not('email', 'is', null)
      .limit(NEW_ROUTING_PER_RUN)
    if (inboxErr) summary.errors.push('inboxes: ' + inboxErr.message)

    for (const c of inboxes || []) {
      const { error } = await supabase.rpc('rr_start_routing', {
        p_contact: (c as any).id,
        p_start: day,
      })
      if (error) summary.errors.push('routing: ' + error.message)
      else summary.routing += 1
    }

    // 1b. Full sequence: named contacts at accounts that score 50+
    const { data: fresh, error: freshErr } = await supabase
      .from('rr_contacts')
      .select('id, persona, email, linkedin_url, rr_accounts!inner(route)')
      .eq('status', 'new')
      .in('rr_accounts.route', ['full_sequence', 'standard_sequence'])
      .limit(80)
    if (freshErr) summary.errors.push('fresh: ' + freshErr.message)

    const eligible = (fresh || [])
      .filter((c: any) => c.persona !== 'generic_inbox' && (c.email || c.linkedin_url))
      .slice(0, NEW_SEQUENCES_PER_RUN)

    for (const c of eligible) {
      const { error } = await supabase.rpc('rr_start_sequence', {
        p_contact: (c as any).id,
        p_start: day,
      })
      if (error) summary.errors.push('sequence: ' + error.message)
      else summary.started += 1
    }

    // 2. Draft touches that are due (touches first, contacts looked up separately)
    const { data: due, error: dueErr } = await supabase
      .from('rr_touches')
      .select('id, code, channel, contact_id')
      .eq('status', 'pending')
      .lte('scheduled_for', day)
      .order('scheduled_for')
      .limit(DRAFTS_PER_RUN)
    if (dueErr) summary.errors.push('due: ' + dueErr.message)
    summary.dueFound = due?.length || 0
    summary.dueCodes = (due || []).map((t: any) => t.code)
    summary.host = host

    await Promise.all(
      (due || []).map(async (t: any) => {
        try {
          const { data: contact, error: cErr } = await supabase
            .from('rr_contacts')
            .select('id, first_name, last_name, title, email, status, account_id')
            .eq('id', t.contact_id)
            .maybeSingle()
          if (cErr) throw new Error('contact: ' + cErr.message)

          let account: any = null
          if (contact?.account_id) {
            const { data: acc } = await supabase
              .from('rr_accounts')
              .select('name, country, category')
              .eq('id', contact.account_id)
              .maybeSingle()
            account = acc
          }

          if (!contact || !['new', 'sequencing'].includes(contact.status)) {
            summary.errors.push(
              `${t.code}: skipped because contact ${contact ? 'status is ' + contact.status : 'was not found (id ' + t.contact_id + ')'}`
            )
            await supabase.from('rr_touches').update({ status: 'skipped' }).eq('id', t.id)
            summary.skipped += 1
            return
          }

          if (t.channel === 'linkedin') {
            const body = fillLinkedIn(t.code, contact, account)
            const { data: upd, error } = await supabase
              .from('rr_touches')
              .update({ status: 'drafted', body })
              .eq('id', t.id)
              .select('id')
            if (error) throw new Error('save: ' + error.message)
            if (!upd || upd.length === 0) throw new Error('save matched 0 rows')
          } else if (!contact.email) {
            summary.errors.push(`${t.code}: skipped because the contact has no email address`)
            await supabase.from('rr_touches').update({ status: 'skipped' }).eq('id', t.id)
            summary.skipped += 1
            return
          } else {
            const d = await draftEmail(t.code, contact, account)
            const { data: upd, error } = await supabase
              .from('rr_touches')
              .update({ status: 'drafted', subject: d.subject, body: d.body })
              .eq('id', t.id)
              .select('id')
            if (error) throw new Error('save: ' + error.message)
            if (!upd || upd.length === 0) throw new Error('save matched 0 rows')
          }
          summary.drafted += 1
        } catch (e: any) {
          summary.failed += 1
          summary.errors.push(`${t.code}: ${e?.message || 'unknown error'}`)
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
