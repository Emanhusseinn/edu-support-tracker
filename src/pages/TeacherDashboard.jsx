import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import '../styles/teacher.scss'

export default function TeacherDashboard() {
  const { user, profile, signOut } = useAuth()
  const [loading, setLoading] = useState(true)

  const [subjects, setSubjects] = useState([])        // {id, name}
  const [selSubject, setSelSubject] = useState(null)

  const [students, setStudents] = useState([])        // {id, full_name, grade}
  const [selStudent, setSelStudent] = useState(null)

  const [objectives, setObjectives] = useState([])    // [{id, title, description, statusRowId, status}]
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('student_objectives_status')
        .select(`
          objective:objectives!inner(
            id,
            subject_id,
            subject:subjects!inner(id, name)
          )
        `)
        .eq('teacher_id', user?.id)

      if (!alive) return
      if (error) { console.error(error); setSubjects([]); setLoading(false); return }

      const uniq = new Map()
      for (const row of data || []) {
        const s = row.objective.subject
        if (s) uniq.set(s.id, s)
      }
      const list = [...uniq.values()].sort((a,b)=>a.name.localeCompare(b.name,'ar'))
      setSubjects(list)
      setSelSubject(prev => prev ?? list[0]?.id ?? null)
      setLoading(false)
    })()

    return () => { alive = false }
  }, [user?.id])

  useEffect(() => {
    if (!selSubject || !user?.id) { setStudents([]); setSelStudent(null); return }
    let alive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('student_objectives_status')
        .select(`
          student:students!inner(id, full_name, grade),
          objective:objectives!inner(id, subject_id)
        `)
        .eq('teacher_id', user.id)
        .eq('objective.subject_id', selSubject)

      if (!alive) return
      if (error) { console.error(error); setStudents([]); return }

      const uniq = new Map()
      for (const row of data || []) {
        const st = row.student
        if (st) uniq.set(st.id, st)
      }
      const list = [...uniq.values()].sort((a,b)=>a.full_name.localeCompare(b.full_name,'ar'))
      setStudents(list)
      setSelStudent(prev => prev ?? list[0]?.id ?? null)
    })()
    return () => { alive = false }
  }, [selSubject, user?.id])

  useEffect(() => {
    if (!selSubject || !selStudent || !user?.id) { setObjectives([]); return }
    let alive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('student_objectives_status')
        .select(`
          id,
          achieved,
          objective:objectives!inner(
            id, title, description, subject_id
          )
        `)
        .eq('teacher_id', user.id)
        .eq('student_id', selStudent)
        .eq('objective.subject_id', selSubject)
        .order('created_at', { ascending: true })

      if (!alive) return
      if (error) { console.error(error); setObjectives([]); return }

      const rows = (data || []).map(r => ({
        id: r.objective.id,
        title: r.objective.title,
        description: r.objective.description,
        statusRowId: r.id,
        status: r.achieved || 'pending',
      }))
      setObjectives(rows)
    })()
    return () => { alive = false }
  }, [selSubject, selStudent, user?.id])

  const currentStatus = useMemo(() => {
    if (!objectives.length) return 'na'
    return objectives[objectives.length - 1].status || 'na'
  }, [objectives])

  const statusToColor = (st) => {
    switch (st) {
      case 'done': return '#22c55e'    
      case 'pending': return '#f59e0b' 
      case 'blocked': return '#ef4444' 
      default: return '#64748b'        
    }
  }

  async function updateStatus(rowId, newValue) {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('student_objectives_status')
        .update({ achieved: newValue })
        .eq('id', rowId)
      if (error) throw error

      setObjectives(prev => prev.map(o =>
        o.statusRowId === rowId ? { ...o, status: newValue } : o
      ))
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="teacher-hero">
      <header className="teacher-top">
        <div className="who">
          <div className="name">{profile?.full_name || 'Teacher'}</div>
          <div className="role">معلم</div>
        </div>
        <button className="logout" onClick={signOut}>Logout</button>
      </header>

      <section className="cards">
        {loading && <div className="hint">Loading subjects…</div>}
        {!loading && !subjects.length && (
          <div className="hint">لا توجد مواد مُسنّدة لك بعد.</div>
        )}
        {subjects.map(s => (
          <button
            key={s.id}
            className={'card ' + (selSubject===s.id ? 'active':'')}
            onClick={() => { setSelSubject(s.id); setSelStudent(null) }}
          >
            <div className="card-title">{s.name}</div>
          </button>
        ))}
      </section>

      {!!selSubject && (
        <section className="students">
          <div className="bar">
            <h3>طلاب مادة: <span>{subjects.find(x=>x.id===selSubject)?.name}</span></h3>
          </div>

          <div className="student-list">
            {students.map(st => (
              <button
                key={st.id}
                className={'student-chip ' + (selStudent===st.id ? 'selected':'')}
                onClick={() => setSelStudent(st.id)}
              >
                {st.full_name}{st.grade ? ` — صف ${st.grade}` : ''}
              </button>
            ))}
            {!students.length && <div className="hint">لا يوجد طلاب لهذه المادة.</div>}
          </div>
        </section>
      )}

      {!!selStudent && (
        <section className="whiteboard">
          <div className="board">
            <div className="board-head">
              <div>
                الطالب: <b>{students.find(s=>s.id===selStudent)?.full_name}</b>
                {'  '}— المادة: <b>{subjects.find(s=>s.id===selSubject)?.name}</b>
              </div>
            </div>

            <div className="board-body">
              <div className="circle-col">
                <div
                  className="status-circle"
                  style={{ background: statusToColor(currentStatus) }}
                  title={`الحالة الحالية: ${currentStatus}`}
                >
                  <div className="circle-label">الهدف الحالي</div>
                </div>
              </div>

              <div className="goals-col">
                {objectives.map((o, idx) => (
                  <div className="goal-row" key={o.id}>
                    <div className="goal-title">{idx+1}. {o.title}</div>
                    <div className="goal-actions">
                      <select
                        value={o.status}
                        disabled={saving}
                        onChange={e=>updateStatus(o.statusRowId, e.target.value)}
                      >
                        <option value="pending">pending</option>
                        <option value="done">done</option>
                        <option value="blocked">blocked</option>
                        <option value="na">na</option>
                      </select>
                      <span className="dot" style={{background: statusToColor(o.status)}} />
                    </div>
                  </div>
                ))}
                {!objectives.length && <div className="hint">لا توجد أهداف مُسنّدة لهذا الطالب في هذه المادة.</div>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
