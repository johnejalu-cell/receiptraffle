'use client'

import { useCallback, useEffect, useState } from 'react'

const REPLY_OPTIONS = [
  ['', 'Prospect replied...'],
  ['replied_positive', 'Positive reply'],
  ['replied_info', 'Asked for info'],
  ['not_now', 'Not now'],
  ['using_agency', 'Uses an agency'],
  ['legal_concern', 'Legal / compliance concern'],
  ['unsubscribed', 'Unsubscribe / stop'],
]

async function api(path: string, key: string, method = 'GET', body?: any) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-ops-key': key },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Request failed')
  return j
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
  marginBottom: 14,
}
const btn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
  color: '#111827',
  display: 'inline-block',
}
const btnPrimary: React.CSSProperties = { ...btn, background: '#111827', color: '#fff', border: '1px solid #111827' }
const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  fontFamily: 'inherit',
}

export default function OpsPage() {
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [edits, setEdits] = useState<Record<string, { subject: string; body: string }>>({})

  const load = useCallback(async (k: string) => {
    try {
      const j = await api('/api/ops/queue', k)
      setData(j)
      setAuthed(true)
      setErr('')
      sessionStorage.setItem('ops_key', k)
    } catch (e: any) {
      setErr(e.message)
      setAuthed(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('ops_key')
    if (saved) {
      setKey(saved)
      load(saved)
    }
  }, [load])

  const val = (t: any) => edits[t.id] || { subject: t.subject || '', body: t.body || '' }
  const setVal = (t: any, patch: Partial<{ subject: string; body: string }>) =>
    setEdits((e) => ({ ...e, [t.id]: { ...val(t), ...patch } }))

  const act = async (body: any) => {
    try {
      await api('/api/ops/queue', key, 'POST', body)
      await load(key)
    } catch (e: any) {
      setErr(e.message)
    }
  }

  const draftNow = async () => {
    setBusy(true)
    setMsg('')
    setErrors([])
    try {
      const j = await api('/api/ops/cron', key)
      setMsg(
        `Date ${j.day}. Due found ${j.dueFound}, drafted ${j.drafted}, failed ${j.failed}, skipped ${j.skipped}, sequences started ${j.started}.`
      )
      setErrors(j.errors || [])
      await load(key)
    } catch (e: any) {
      setErr(e.message)
    }
    setBusy(false)
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <h2>Receiptraffle Ops</h2>
        <input
          style={input}
          type="password"
          placeholder="Ops password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(key)}
        />
        <div style={{ marginTop: 10 }}>
          <button style={btnPrimary} onClick={() => load(key)}>
            Open
          </button>
        </div>
        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}
      </div>
    )
  }

  const s = data?.stats || {}
  const queue: any[] = data?.queue || []

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 14, fontFamily: 'system-ui, sans-serif', background: '#f3f4f6', minHeight: '100vh' }}>
      <h2 style={{ margin: '8px 0' }}>Today's outreach</h2>
      <div style={{ ...card, fontSize: 14 }}>
        <div>
          <b>{queue.length}</b> waiting for you · <b>{s.pending}</b> scheduled · <b>{s.sent}</b> sent · <b>{s.blocked}</b> blocked · <b>{s.newContacts}</b> new contacts not started
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btnPrimary} onClick={draftNow} disabled={busy}>
            {busy ? 'Drafting...' : "Draft today's touches now"}
          </button>
        </div>
        <label style={{ display: 'block', marginTop: 12, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={!!data?.apoApproved}
            onChange={(e) => act({ action: 'apo_approved', value: e.target.checked })}
          />{' '}
          Apo has approved being named (unblocks the E3 email)
        </label>
        {msg && <p style={{ color: '#065f46', fontSize: 13 }}>{msg}</p>}
        {errors.length > 0 && (
          <div style={{ color: '#b91c1c', fontSize: 13, wordBreak: 'break-word' }}>
            <b>Errors:</b>
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}
        {err && <p style={{ color: '#b91c1c', fontSize: 13 }}>{err}</p>}
      </div>

      {queue.length === 0 && <div style={card}>Nothing waiting. Check back after the morning run, or draft now.</div>}

      {queue.map((t: any) => {
        const c = t.rr_contacts || {}
        const a = c.rr_accounts || {}
        const v = val(t)
        const isEmail = t.channel === 'email'
        const mailto = `mailto:${c.email || ''}?subject=${encodeURIComponent(v.subject)}&body=${encodeURIComponent(v.body)}`
        const wa = c.whatsapp
          ? `https://wa.me/${String(c.whatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(v.body)}`
          : ''
        return (
          <div key={t.id} style={card}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {t.code} · {t.channel === 'email' ? 'Email' : 'LinkedIn (you send manually)'} · score {a.score}
            </div>
            <div style={{ fontWeight: 600, margin: '4px 0 10px' }}>
              {c.first_name} {c.last_name} · {c.title || 'title unknown'} · {a.name}
            </div>
            {isEmail && (
              <input
                style={{ ...input, marginBottom: 8 }}
                value={v.subject}
                onChange={(e) => setVal(t, { subject: e.target.value })}
              />
            )}
            <textarea
              style={{ ...input, minHeight: 170 }}
              value={v.body}
              onChange={(e) => setVal(t, { body: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {isEmail && c.email && (
                <a style={btnPrimary} href={mailto}>
                  Open in email
                </a>
              )}
              {!isEmail && c.linkedin_url && (
                <a style={btnPrimary} href={c.linkedin_url} target="_blank" rel="noreferrer">
                  Open LinkedIn
                </a>
              )}
              {wa && (
                <a style={btn} href={wa} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
              <button
                style={btn}
                onClick={() => navigator.clipboard.writeText(v.body).then(() => setMsg('Copied.'))}
              >
                Copy
              </button>
              <button style={btn} onClick={() => act({ action: 'save', id: t.id, subject: v.subject, body: v.body })}>
                Save edits
              </button>
              <button style={btn} onClick={() => act({ action: 'sent', id: t.id, subject: v.subject, body: v.body })}>
                Mark sent
              </button>
              <button style={btn} onClick={() => act({ action: 'skip', id: t.id })}>
                Skip
              </button>
            </div>
            <select
              style={{ ...input, marginTop: 10 }}
              value=""
              onChange={(e) => e.target.value && act({ action: 'contact_status', contact_id: c.id, status: e.target.value })}
            >
              {REPLY_OPTIONS.map(([val2, label]) => (
                <option key={val2} value={val2}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}
