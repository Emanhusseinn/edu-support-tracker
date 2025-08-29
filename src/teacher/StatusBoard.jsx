// src/teacher/StatusBoard.jsx
export default function StatusBoard({ objectives, onUpdate, saving, currentStatusColor, studentName, subjectName }) {
  return (
    <section className="whiteboard">
      <div className="board">
        <div className="board-head">
          <div>الطالب: <b>{studentName}</b> — المادة: <b>{subjectName}</b></div>
        </div>
        <div className="board-body">
          <div className="circle-col">
            <div className="status-circle" style={{ background: currentStatusColor }}>
              <div className="circle-label">الهدف الحالي</div>
            </div>
          </div>
          <div className="goals-col">
            {objectives.map((o, idx) => (
              <div className="goal-row" key={o.id}>
                <div className="goal-title">{idx+1}. {o.title}</div>
                <div className="goal-actions">
                  <select value={o.status} disabled={saving} onChange={e=>onUpdate(o.statusRowId, e.target.value)}>
                    <option value="pending">قيد الإنتظار</option>
                    <option value="done">منتهية</option>
                    <option value="na">لم تتم بعد</option>
                  </select>
                  <span className="dot" />
                </div>
              </div>
            ))}
            {!objectives.length && <div className="hint">لا توجد أهداف مُسنّدة لهذا الطالب في هذه المادة.</div>}
          </div>
        </div>
      </div>
    </section>
  )
}
