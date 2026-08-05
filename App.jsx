import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'
import { nextThursday, addWeeks, toISODate } from './lib/weeks'
import Login from './components/Login'
import WeekNav from './components/WeekNav'
import OrdersTab from './components/OrdersTab'
import BakeSheetTab from './components/BakeSheetTab'
import CustomersTab from './components/CustomersTab'

const TABS = ['Orders', 'Bake Sheet', 'Customers']

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('Orders')
  const [week, setWeek] = useState(nextThursday())

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const weekISO = toISODate(week)

  const loadData = useCallback(async () => {
    if (!session) return
    setLoadingData(true)
    const [customersRes, productsRes, ordersRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('products').select('*').eq('active', true).order('sort_order'),
      supabase.from('orders').select('*').eq('pickup_week', weekISO),
    ])
    if (customersRes.error) console.error(customersRes.error)
    if (productsRes.error) console.error(productsRes.error)
    if (ordersRes.error) console.error(ordersRes.error)
    setCustomers(customersRes.data ?? [])
    setProducts(productsRes.data ?? [])
    setOrders(ordersRes.data ?? [])
    setLoadingData(false)
  }, [session, weekISO])

  useEffect(() => { loadData() }, [loadData])

  if (authLoading) return <div className="center-screen">Loading…</div>
  if (!session) return <Login />

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>4K BAKED</h1>
        <button className="btn-signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>

      <WeekNav
        week={week}
        onPrev={() => setWeek((w) => addWeeks(w, -1))}
        onNext={() => setWeek((w) => addWeeks(w, 1))}
      />

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t}
            className={tab === t ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <main>
        {loadingData ? (
          <p className="empty-state">Loading…</p>
        ) : tab === 'Orders' ? (
          <OrdersTab
            orders={orders}
            customers={customers}
            products={products}
            weekISO={weekISO}
            onChange={loadData}
          />
        ) : tab === 'Bake Sheet' ? (
          <BakeSheetTab orders={orders} products={products} customers={customers} />
        ) : (
          <CustomersTab customers={customers} onChange={loadData} />
        )}
      </main>
    </div>
  )
}
