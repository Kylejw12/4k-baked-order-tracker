// Rolling "Week of [Thursday]" helpers

// Returns a Date for the next upcoming Thursday (or today, if today is Thursday)
export function nextThursday(from = new Date()) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun ... 4=Thu ... 6=Sat
  const diff = (4 - day + 7) % 7
  d.setDate(d.getDate() + diff)
  return d
}

export function addWeeks(date, weeks) {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

// Format as YYYY-MM-DD for storing/querying against a Postgres `date` column
export function toISODate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Format for display, e.g. "Thursday, August 6, 2026"
export function formatWeekLabel(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
