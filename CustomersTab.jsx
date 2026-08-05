import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CustomersTab({ customers, onChange }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  function startEdit(c) {
    setEditingId(c.id)
    setName(c.name)
    setPhone(c.phone ?? '')
    setNotes(c.notes ?? '')
    setShowForm(true)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setPhone('')
    setNotes('')
    setShowForm(false)
  }

  async function saveCustomer(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const payload = { name: name.trim(), phone: phone.trim() || null, notes: notes.trim() || null }
    const { error } = editingId
      ? await supabase.from('customers').update(payload).eq('id', editingId)
      : await supabase.from('customers').insert(payload)
    setSaving(false)
    if (error) {
      alert('Could not save customer: ' + error.message)
      return
    }
    resetForm()
    onChange()
  }

  async function deleteCustomer(id) {
    if (!confirm('Delete this customer? Their past orders will also be removed.')) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      alert('Could not delete: ' + error.message)
      return
    }
    onChange()
  }

  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="tab-content">
      <button className="btn-primary btn-full" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
        {showForm ? 'Cancel' : '+ New Customer'}
      </button>

      {showForm && (
        <form className="card form-card" onSubmit={saveCustomer}>
          <label className="field-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="field-label">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="field-label">Notes</label>
          <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button type="submit" className="btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update Customer' : 'Save Customer'}
          </button>
        </form>
      )}

      {sorted.length === 0 && !showForm && (
        <p className="empty-state">No customers yet.</p>
      )}

      {sorted.map((c) => (
        <div key={c.id} className="card customer-row" onClick={() => startEdit(c)}>
          <div>
            <div className="customer-name">{c.name}</div>
            {c.phone && <div className="customer-phone">{c.phone}</div>}
            {c.notes && <div className="customer-notes">{c.notes}</div>}
          </div>
          <button
            className="btn-icon-delete"
            onClick={(e) => { e.stopPropagation(); deleteCustomer(c.id) }}
          >✕</button>
        </div>
      ))}
    </div>
  )
}
