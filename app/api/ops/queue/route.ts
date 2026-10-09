import { NextRequest, NextResponse } from 'next/server'
import { db, opsAuthorized } from '../../../ops/lib'

export const dynamic = 'force-dynamic'

const REPLY_STATUSES = [
  'replied_positive',
  'replied_info',
  'not_now',
  'using_agency',
  'legal_concern',
  'closed',
]

export async function GET(req: NextRequest) {
  if (!opsAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = db()

    const { data: queue, error } = await supabase
      .from('rr_touches')
      .select(
        'id, code, channel, scheduled_for, subject, body, rr_contacts(id, first_name, last_name, title, email, linkedin_url, whatsapp, status, rr_accounts(name, country, score))'
      )
      .eq('status', 'drafted')
      .order('scheduled_for')
    if (error) throw new Error(error.message)

    const count = async (status: string) => {
      const { count } = await supabase
        .from('rr_touches')
        .select('id', { count: 'exact', head: true })
        .eq('status', status)
      return count || 0
    }
    const { count: newContacts } = await supabase
      .from('rr_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')

    const { data: apo } = await supabase
      .from('rr_settings')
      .select('value')
      .eq('key', 'apo_reference_approved')
      .maybeSingle()

    return NextResponse.json({
      queue: queue || [],
      stats: {
        pending: await count('pending'),
        blocked: await count('blocked'),
        sent: await count('sent'),
        newContacts: newContacts || 0,
      },
      apoApproved: apo?.value === 'true',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!opsAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = db()
    const b = await req.json()

    if (b.action === 'save') {
      await supabase.from('rr_touches').update({ subject: b.subject, body: b.body }).eq('id', b.id)
      return NextResponse.json({ ok: true })
    }

    if (b.action === 'sent') {
      await supabase
        .from('rr_touches')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          subject: b.subject,
          body: b.body,
        })
        .eq('id', b.id)
      return NextResponse.json({ ok: true })
    }

    if (b.action === 'skip') {
      await supabase.from('rr_touches').update({ status: 'skipped' }).eq('id', b.id)
      return NextResponse.json({ ok: true })
    }

    if (b.action === 'contact_status') {
      const { data: contact } = await supabase
        .from('rr_contacts')
        .select('id, email, linkedin_url')
        .eq('id', b.contact_id)
        .maybeSingle()
      if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

      await supabase.from('rr_contacts').update({ status: b.status }).eq('id', b.contact_id)

      if (b.status === 'unsubscribed') {
        await supabase
          .from('rr_suppression')
          .insert({ email: contact.email, linkedin_url: contact.linkedin_url })
      }
      if (b.status === 'unsubscribed' || REPLY_STATUSES.includes(b.status)) {
        await supabase
          .from('rr_touches')
          .update({ status: 'skipped' })
          .eq('contact_id', b.contact_id)
          .in('status', ['pending', 'drafted', 'blocked'])
      }
      return NextResponse.json({ ok: true })
    }

    if (b.action === 'apo_approved') {
      await supabase
        .from('rr_settings')
        .upsert({ key: 'apo_reference_approved', value: b.value ? 'true' : 'false' })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
