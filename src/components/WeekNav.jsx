import { formatWeekLabel } from '../lib/weeks'

export default function WeekNav({ week, onPrev, onNext }) {
  return (
    <div className="week-nav">
      <button className="week-arrow" onClick={onPrev} aria-label="Previous week">‹</button>
      <div className="week-label">
        <div className="week-label-small">Week of</div>
        <div className="week-label-big">{formatWeekLabel(week)}</div>
      </div>
      <button className="week-arrow" onClick={onNext} aria-label="Next week">›</button>
    </div>
  )
}
