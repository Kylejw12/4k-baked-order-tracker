import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

const STATUS_CYCLE = ['Pending', 'Ready', 'Picked up']
const STATUS_CLASS = {
  Pending: 'pill-pending',
  Ready: 'pill-ready',
  'Picked up': 'pill-picked',
}

export default function OrdersTab({ orders, customers, products, weekISO, onChange }) {
  const [showForm, setShowForm] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [size, setSize] = useState('small')
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)

  const selectedProduct = products.find((p) => p.id === productId)

  const customerName = (id) => customers.find((c) => c.id === id)?.name ?? 'Unknown'
  const productLabel = (order) => {
    const p = products.find((pr) => pr.id === order.product_id)
    if (!p) return 'Unknown item'
    const unit = order.size === 'small' ? p.unit_small : p.unit_large
    return `${p.name} (${unit}) — ${p.category}`
  }

  async function addOrder(e) {
    e.preventDefault()
    if (!customerId || !productId) return
    setSaving(true)
    const { error } = await supabase.from('orders').insert({
      customer_id: customerId,
      product_id: productId,
      size,
      quantity: Number(quantity),
      pickup_week: weekISO,
      status: 'Pending',
    })
    setSaving(false)
    if (error) {
      alert('Could not save order: ' + error.message)
      return
    }
    setCustomerId('')
    setProductId('')
    setSize('small')
    setQuantity(1)
    setShowForm(false)
    onChange()
  }

  async function cycleStatus(order) {
    const idx = STATUS_CYCLE.indexOf(order.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', order.id)
    if (error) {
      alert('Could not update status: ' + error.message)
      return
    }
    onChange()
  }

  async function deleteOrder(id) {
    if (!confirm('Delete this order?')) return
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) {
      alert('Could not delete: ' + error.message)
      return
    }
    onChange()
  }

  const grouped = useMemo(() => {
    const byCategory = {}
    for (const o of orders) {
      const p = products.find((pr) => pr.id === o.product_id)
      const cat = p?.category ?? 'Other'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(o)
    }
    return byCategory
  }, [orders, products])

  return (
    <div className="tab-content">
      <button className="btn-primary btn-full" onClick={() => setShowForm((s) => !s)}>
        {showForm ? 'Cancel' : '+ New Order'}
      </button>

      {showForm && (
        <form className="card form-card" onSubmit={addOrder}>
          <label className="field-label">Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label className="field-label">Item</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">Select item…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.category} — {p.name}</option>
            ))}
          </select>

          {selectedProduct && (
            <>
              <label className="field-label">Size</label>
              <div className="size-toggle">
                <button
                  type="button"
                  className={size === 'small' ? 'toggle-btn active' : 'toggle-btn'}
                  onClick={() => setSize('small')}
                >
                  {selectedProduct.unit_small} (${selectedProduct.price_small})
                </button>
                <button
                  type="button"
                  className={size === 'large' ? 'toggle-btn active' : 'toggle-btn'}
                  onClick={() => setSize('large')}
                >
                  {selectedProduct.unit_large} (${selectedProduct.price_large})
                </button>
              </div>
            </>
          )}

          <label className="field-label">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <button type="submit" className="btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </form>
      )}

      {orders.length === 0 && !showForm && (
        <p className="empty-state">No orders yet for this week.</p>
      )}

      {Object.entries(grouped).map(([category, catOrders]) => (
        <div key={category} className="order-group">
          <h3 className="group-heading">{category}</h3>
          {catOrders.map((o) => (
            <div key={o.id} className="order-row card">
              <div className="order-row-main">
                <div className="order-customer">{customerName(o.customer_id)}</div>
                <div className="order-item">{productLabel(o)} × {o.quantity}</div>
              </div>
              <div className="order-row-actions">
                <button
                  className={`status-pill ${STATUS_CLASS[o.status]}`}
                  onClick={() => cycleStatus(o)}
                >
                  {o.status}
                </button>
                <button className="btn-icon-delete" onClick={() => deleteOrder(o.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
