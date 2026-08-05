import { useMemo } from 'react'

// Aggregation logic:
// - "large" size orders (Full / Dozen) each count as 1 whole unit directly.
// - "small" size orders (Half / Half Dozen) are paired up: every 2 halves = 1 whole unit.
//   An odd leftover half is called out separately so you know to bake a partial/extra.
function aggregate(orders, products, customers) {
  const byProduct = {}

  for (const o of orders) {
    const p = products.find((pr) => pr.id === o.product_id)
    if (!p) continue
    if (!byProduct[p.id]) {
      byProduct[p.id] = { product: p, smallQty: 0, largeQty: 0, breakdown: [] }
    }
    const entry = byProduct[p.id]
    if (o.size === 'small') entry.smallQty += o.quantity
    else entry.largeQty += o.quantity

    const customer = customers.find((c) => c.id === o.customer_id)
    entry.breakdown.push({
      customer: customer?.name ?? 'Unknown',
      size: o.size === 'small' ? p.unit_small : p.unit_large,
      quantity: o.quantity,
      status: o.status,
    })
  }

  return Object.values(byProduct)
    .map((entry) => {
      const pairsFromSmall = Math.floor(entry.smallQty / 2)
      const leftoverHalf = entry.smallQty % 2
      const wholeUnits = entry.largeQty + pairsFromSmall
      return { ...entry, wholeUnits, leftoverHalf }
    })
    .sort((a, b) => a.product.category.localeCompare(b.product.category) || a.product.name.localeCompare(b.product.name))
}

export default function BakeSheetTab({ orders, products, customers }) {
  const rows = useMemo(() => aggregate(orders, products, customers), [orders, products, customers])

  const grouped = useMemo(() => {
    const g = {}
    for (const r of rows) {
      if (!g[r.product.category]) g[r.product.category] = []
      g[r.product.category].push(r)
    }
    return g
  }, [rows])

  if (rows.length === 0) {
    return <p className="empty-state">No orders logged for this week yet — nothing to bake.</p>
  }

  return (
    <div className="tab-content">
      {Object.entries(grouped).map(([category, catRows]) => (
        <div key={category} className="order-group">
          <h3 className="group-heading">{category}</h3>
          {catRows.map((r) => (
            <div key={r.product.id} className="card bake-card">
              <div className="bake-card-header">
                <span className="bake-item-name">{r.product.name}</span>
                <span className="bake-total">
                  {r.wholeUnits} {r.wholeUnits === 1 ? r.product.unit_large : r.product.unit_large + 's'}
                  {r.leftoverHalf > 0 && (
                    <span className="bake-leftover"> + 1 {r.product.unit_small}</span>
                  )}
                </span>
              </div>
              <div className="bake-breakdown">
                {r.breakdown.map((b, i) => (
                  <div key={i} className="bake-breakdown-row">
                    <span>{b.customer}</span>
                    <span className="bake-breakdown-detail">
                      {b.quantity}× {b.size} · {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
