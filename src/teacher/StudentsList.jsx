// src/teacher/StudentsList.jsx
export default function StudentsList({ subjectName, students, selStudent, setSelStudent }) {
  return (
    <section className="students">
      <div className="bar"><h3>طلاب مادة: <span>{subjectName}</span></h3></div>
      <div className="student-list">
        {students.map(st => (
          <button key={st.id} className={'student-chip ' + (selStudent===st.id ? 'selected':'')}
            onClick={() => setSelStudent(st.id)}>
            {st.full_name}{st.grade ? ` — صف ${st.grade}` : ''}
          </button>
        ))}
        {!students.length && <div className="hint">لا يوجد طلاب لهذه المادة.</div>}
      </div>
    </section>
  )
}
