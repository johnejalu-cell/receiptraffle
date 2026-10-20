'use client'
import { useCallback, useEffect, useState } from 'react'

type Form = { mode: 'single' | 'daily'; day: string; count: number; prize: string; onePerPhone: boolean }
const blank: Form = { mode: 'single', day: '', count: 1, prize: '', onePerPhone: false }

const btn = (color: string): React.CSSProperties => ({ padding: '7px 12px', border: '1px solid ' + color, background: 'white', color, borderRadius: 8, cursor: 'pointer', fontSize: 13 })
const input: React.CSSProperties = { padding: 9, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }

export default function AdminDraws({ promotions, entries, pin }: { promotions: any[]; entries: any[]; pin: string }) {
  const [winners, setWinners] = useState<any[]>([])
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [forms, setForms] = useState<Record<string, Form>>({})
  const [msgs, setMsgs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [loadError, setLoadError] = useState('')

  const headers = { 'Content-Type': 'application/json', 'x-admin-pin': pin }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/draws', { headers: { 'x-admin-pin': pin }, cache: 'no-store' })
      const d = await res.json()
      if (!res.ok) { setLoadError(d.error || 'Could not load draws'); return }
      setLoadError(''); setWinners(d.winners || []); setFlags(d.flags || {})
    } catch { setLoadError('Could not reach the server') }
  }, [pin])
  useEffect(() => { load() }, [load])

  const form = (id: string): Form => forms[id] || blank
  const setForm = (id: string, patch: Partial<Form>) => setForms(f => ({ ...f, [id]: { ...form(id), ...patch } }))
  const say = (id: string, m: string) => setMsgs(x => ({ ...x, [id]: m }))

  async function post(promoId: string, body: any): Promise<any> {
    setBusy(promoId); say(promoId, '')
    try {
      const res = await fetch('/api/admin/draws', { method: 'POST', headers, body: JSON.stringify({ promotionId: promoId, ...body }) })
      const d = await res.json()
      if (res.status === 409 && body.action === 'draw' && !body.again) {
        if (confirm(d.error)) { setBusy(''); return post(promoId, { ...body, again: true }) }
        say(promoId, 'Draw cancelled'); return null
      }
      if (!res.ok) throw new Error(d.error)
      await load()
      return d
    } catch (e: unknown) {
      say(promoId, e instanceof Error ? e.message : 'Failed'); return null
    } finally { setBusy('') }
  }

  async function runDraw(p: any) {
    const f = form(p.id)
    const d = await post(p.id, { action: 'draw', mode: f.mode, day: f.day || undefined, count: f.count, prizeLabel: f.prize, onePrizePerPhone: f.onePerPhone })
    if (d) say(p.id, 'Drew ' + d.drawn + ' winner(s)' + (d.day ? ' for ' + d.day : '') + ' from ' + d.eligible + ' eligible entries.')
  }
  async function act(p: any, w: any, action: string, ask?: string) {
    let note = ''
    if (ask) { const n = window.prompt(ask); if (n === null) return; note = n }
    const f = form(p.id)
    const d = await post(p.id, { action, id: w.id, note, onePrizePerPhone: f.onePerPhone })
    if (d && action === 'fail') say(p.id, d.replacement ? 'Replacement winner drawn.' : d.message || 'No replacement available.')
  }
  async function toggle(p: any, enabled: boolean) {
    await post(p.id, { action: 'toggle_promoter', enabled })
  }

  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Prize draws</p>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>All draws are run here. Switch &quot;Promoter can run draws&quot; on to give a promoter their own draw buttons.</p>
      {loadError && <div style={{ background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{loadError}</div>}
      {promotions.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No active promotions</div>}
      {promotions.map(p => {
        const eligible = entries.filter(e => e.promotion_id === p.id && e.verification_status === 'approved').length
        const f = form(p.id)
        const mine = winners.filter(w => w.promotion_id === p.id)
        const switchKnown = Object.prototype.hasOwnProperty.call(flags, p.id)
        return (
          <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{p.promo_name}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{p.company_name} · {eligible} approved entries · Draw: {p.draw_date}</div>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, background: '#f5f5f0', padding: '8px 10px', borderRadius: 8, marginBottom: 12, cursor: switchKnown ? 'pointer' : 'default' }}>
              <input type="checkbox" disabled={!switchKnown || busy === p.id} checked={!!flags[p.id]} onChange={e => toggle(p, e.target.checked)} />
              <span>Promoter can run draws {switchKnown ? '' : '(run the SQL update first)'}</span>
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#555' }}>Type<br />
                <select value={f.mode} onChange={e => setForm(p.id, { mode: e.target.value as 'single' | 'daily' })} style={input}>
                  <option value="single">Single draw (all entries)</option>
                  <option value="daily">Daily draw (one day)</option>
                </select>
              </label>
              {f.mode === 'daily' && <label style={{ fontSize: 12, color: '#555' }}>Day<br /><input type="date" value={f.day} onChange={e => setForm(p.id, { day: e.target.value })} style={input} /></label>}
              {f.mode === 'daily' && <label style={{ fontSize: 12, color: '#555' }}>Winners<br /><input type="number" min={1} max={20} value={f.count} onChange={e => setForm(p.id, { count: parseInt(e.target.value, 10) || 1 })} style={{ ...input, width: 80 }} /></label>}
              <label style={{ fontSize: 12, color: '#555', flex: 1, minWidth: 150 }}>Prize label<br /><input value={f.prize} onChange={e => setForm(p.id, { prize: e.target.value })} placeholder="e.g. UGX 20,000 airtime" style={{ ...input, width: '100%', boxSizing: 'border-box' }} /></label>
              <button onClick={() => runDraw(p)} disabled={busy === p.id || eligible === 0} style={{ padding: '11px 18px', background: eligible === 0 ? '#ddd' : '#534AB7', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {busy === p.id ? 'Working...' : eligible === 0 ? 'No eligible entries' : 'Run draw'}
              </button>
            </div>
            <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 8 }}>
              <input type="checkbox" checked={f.onePerPhone} onChange={e => setForm(p.id, { onePerPhone: e.target.checked })} /> One prize per phone number (leave unticked to allow repeat winners)
            </label>
            {msgs[p.id] && <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{msgs[p.id]}</div>}

            {mine.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13 }}>No winners drawn yet.</div> : mine.map(w => (
              <div key={w.id} style={{ borderTop: '1px solid #f1f1f1', padding: '10px 0', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div><b>{w.winner_name}</b> · <a href={'tel:' + w.winner_phone} style={{ color: '#534AB7' }}>{w.winner_phone}</a> · ticket {w.winner_ticket}</div>
                  <div style={{ color: '#888' }}>{w.draw_type === 'daily' ? 'Daily ' + (w.draw_day || '') : 'Single draw'} · by {w.drawn_by}</div>
                </div>
                <div style={{ color: '#555', margin: '4px 0' }}>Bar on bill: <b>{w.outlet_name || 'not read'}</b>{w.receipt_amount ? ' · UGX ' + Number(w.receipt_amount).toLocaleString() : ''}{w.prize_label ? ' · Prize: ' + w.prize_label : ''}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: w.winner_status === 'verified' ? '#dcfce7' : w.winner_status === 'failed' ? '#fee2e2' : '#fef3c7', color: w.winner_status === 'verified' ? '#166534' : w.winner_status === 'failed' ? '#991b1b' : '#92400e' }}>{w.winner_status === 'verified' ? 'Verified' : w.winner_status === 'failed' ? 'Failed' : 'To verify'}</span>
                  {w.prize_status === 'paid' && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}>Paid{w.payment_ref ? ' (' + w.payment_ref + ')' : ''}</span>}
                  {w.winner_status === 'pending' && <>
                    <button disabled={busy === p.id} onClick={() => act(p, w, 'verify', 'Who at the bar confirmed the bill? (optional note)')} style={btn('#16a34a')}>Verified</button>
                    <button disabled={busy === p.id} onClick={() => { if (confirm('Mark this winner as failed and draw a replacement?')) act(p, w, 'fail', 'Reason (optional note)') }} style={btn('#dc2626')}>Failed, redraw</button>
                  </>}
                  {w.winner_status !== 'failed' && w.prize_status !== 'paid' && (w.draw_type !== 'daily' || w.winner_status === 'verified') && <button disabled={busy === p.id} onClick={() => act(p, w, 'paid', 'Payment reference (airtime or mobile money ref)')} style={btn('#2563eb')}>Mark paid</button>}
                </div>
                {w.verification_note && <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Note: {w.verification_note}</div>}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
