// src/teacher/SubjectCards.jsx
export default function SubjectCards({ loading, subjects, selSubject, setSelSubject, setSelStudent }) {
  return (
    <section className="cards">
      {loading && <div className="hint">Loading subjects…</div>}
      {!loading && !subjects.length && <div className="hint">لا توجد مواد مُسنّدة لك بعد.</div>}
      {subjects.map(s => (
        <button key={s.id} className={'card ' + (selSubject===s.id ? 'active':'')}
          onClick={() => { setSelSubject(s.id); setSelStudent(null) }}>
          <div className="card-title">{s.name}</div>
        </button>
      ))}
    </section>
  )
}
