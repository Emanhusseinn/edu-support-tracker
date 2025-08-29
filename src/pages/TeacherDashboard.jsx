import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import '../styles/teacher.scss'
import { FaRegUserCircle } from "react-icons/fa";

const DISABILITIES = [
  { value: 'none',       label: 'بدون' },
  { value: 'visual',     label: 'بصرية' },
  { value: 'hearing',    label: 'سمعية' },
  { value: 'intellectual', label: 'ذهنية' },
  { value: 'autism',     label: 'طيف التوحد' },
  { value: 'learning',   label: 'صعوبات تعلم' },
  { value: 'speech',     label: 'نطق/لغة' },
  { value: 'adhd',       label: 'فرط حركة/نقص انتباه' },
  { value: 'physical',   label: 'حركية' },
  { value: 'multiple',   label: 'متعددة' },
  { value: 'other',      label: 'أخرى' },
]

const PLAN_TYPES = [
  { value: 'iep',        label: 'خطة فردية (IEP)' },
  { value: 'behavior',   label: 'خطة سلوكية' },
  { value: 'remedial',   label: 'خطة علاجية/تقوية' },
  { value: 'support',    label: 'خطة دعم' },
  { value: 'gifted',     label: 'خطة للموهوبين' },
  { value: 'rehab',      label: 'تأهيلية' },
  { value: 'other',      label: 'أخرى' },
]

const GRADES_FULL = [{v:0, t:'روضة'}, ...Array.from({length:12}, (_,i)=>({v:i+1, t:`${i+1}`}))]

export default function TeacherDashboard() {
  const { user, profile, signOut } = useAuth()

  // تبويب
  const [tab, setTab] = useState('add')

  // ---------------------- Dashboard (كما هو) ----------------------
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

  // ---------------------- تبويب Add student (جديد) ----------------------
  const [allSubjects, setAllSubjects] = useState([])     // كل المواد (من جدول subjects)
  const [selectedSubjects, setSelectedSubjects] = useState([]) // ids
  const [subjObjectives, setSubjObjectives] = useState({})     // {subjectId: [{id,title,description}]}
  const [selectedObjIds, setSelectedObjIds] = useState({})     // {subjectId: Set(ids)}

  // طلابي
  const [myStudents, setMyStudents] = useState([])
  const [loadMyBusy, setLoadMyBusy] = useState(false)

  async function loadMyStudents() {
    try {
      setLoadMyBusy(true)
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, grade, disability, plan_type')
        .eq('teacher_id', user?.id)
        .order('full_name', { ascending: true })
      if (error) throw error
      setMyStudents(data || [])
    } catch (e) {
      console.error(e)
      setMyStudents([])
    } finally {
      setLoadMyBusy(false)
    }
  }

  // كل المواد
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('subjects').select('id, name').order('name', {ascending:true})
      if (!error) setAllSubjects(data || [])
    })()
  }, [])

  useEffect(() => { if (user?.id) loadMyStudents() }, [user?.id])
  useEffect(() => { if (tab==='add') loadMyStudents() }, [tab])

  // فورم الإضافة
  const [stName, setStName] = useState('')
  const [stGrade, setStGrade] = useState('')
  const [stDisability, setStDisability] = useState('')
  const [stPlan, setStPlan] = useState('')
  const [adding, setAdding] = useState(false)

  // تحميل أهداف مادة محدَّدة لصف محدَّد
  async function loadObjectivesForSubject(subjectId, gradeVal) {
    if (!subjectId || gradeVal==='' || gradeVal===null || gradeVal===undefined) return
    const { data, error } = await supabase
      .from('objectives')
      .select('id, title, description')
      .eq('subject_id', subjectId)
      .eq('grade', Number(gradeVal))
      .order('created_at', { ascending: false })
    if (!error) {
      setSubjObjectives(prev => ({ ...prev, [subjectId]: (data || []) }))
    }
  }

  // عند تغيير الصف أعيد تحميل أهداف كل المواد المختارة
  useEffect(() => {
    (async () => {
      for (const sid of selectedSubjects) {
        await loadObjectivesForSubject(sid, stGrade)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stGrade])

  // اختيار/إلغاء مادة
  function toggleSubject(subjectId) {
    setSelectedSubjects(prev => {
      const exists = prev.includes(subjectId)
      const next = exists ? prev.filter(x=>x!==subjectId) : [...prev, subjectId]
      // حمّل أهداف المادة إذا أضيفت ومعنا صف
      if (!exists && stGrade!=='') {
        loadObjectivesForSubject(subjectId, stGrade)
      }
      return next
    })
  }

  // اختيار/إلغاء هدف داخل مادة
  function toggleObjective(subjectId, objectiveId) {
    setSelectedObjIds(prev => {
      const set = new Set(prev[subjectId] || [])
      if (set.has(objectiveId)) set.delete(objectiveId)
      else set.add(objectiveId)
      return { ...prev, [subjectId]: set }
    })
  }

  async function addStudent() {
    if (!stName.trim()) return
    try {
      setAdding(true)
      // 1) إنشاء الطالب وإرجاع id
      const payload = {
        full_name: stName.trim(),
        grade: stGrade === '' ? null : Number(stGrade),
        disability: stDisability || null,
        plan_type: stPlan || null,
        teacher_id: user?.id || null,
      }
      const { data: inserted, error } = await supabase
        .from('students')
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error
      const studentId = inserted.id

      // 2) جمع كل الأهداف المختارة عبر المواد
      const chosenObjectiveIds = Object.values(selectedObjIds)
        .flatMap(set => Array.from(set || []))

      if (chosenObjectiveIds.length) {
        const rows = chosenObjectiveIds.map(oid => ({
          teacher_id: user?.id,
          student_id: studentId,
          objective_id: oid,
          achieved: 'pending',
          notes: ''
        }))
        const { error: e2 } = await supabase
          .from('student_objectives_status')
          .insert(rows)
        if (e2) throw e2
      }

      // 3) تنظيف + تحديث قائمة طلابي
      setStName('')
      setStGrade('')
      setStDisability('')
      setStPlan('')
      setSelectedSubjects([])
      setSubjObjectives({})
      setSelectedObjIds({})
      await loadMyStudents()
    } catch (e) {
      alert(e.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="teacher-hero">

      <header className="teacher-top">
        <div className="who">
<div className="name">
  <span><FaRegUserCircle /> </span>
   <p> {profile?.full_name || 'معلّم'}</p> 
   <p> {profile?.school_name ? ` — ${profile.school_name}` : ''}</p> 
   </div>
        </div>
        <button className="logout" onClick={signOut}>تسجيل الخروج</button>
      </header>

      {/* Tabs */}
      <div className="teacher-tabs">
        <button className={tab==='add'?'active add-stu-btn':'add-stu-btn'} onClick={()=>setTab('add')}>اضافة طالب</button>
        <button className={tab==='dashboard'?'active add-stu-btn':'add-stu-btn'} onClick={()=>setTab('dashboard')}>جميع الطلاب</button>
      </div>

      {/* ============== Add student ============== */}
      {tab === 'add' && (
        <section className="add-student-card">
          <h3>إضافة طالب جديد</h3>
          <div className="form-grid">
            <label className="field">
              <span>اسم الطالب</span>
              <input
                value={stName}
                onChange={e=>setStName(e.target.value)}
                placeholder="مثال: لولو خالد"
              />
            </label>

            <label className="field">
              <span>الصف</span>
              <select value={stGrade} onChange={e=>setStGrade(e.target.value)}>
                <option value="">— اختاري —</option>
                {GRADES_FULL.map(g => (
                  <option key={g.v} value={g.v}>{g.t}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>الإعاقة</span>
              <select value={stDisability} onChange={e=>setStDisability(e.target.value)}>
                <option value="">— اختياري —</option>
                {DISABILITIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>

            <label className="field">
              <span>نوع الخطة</span>
              <select value={stPlan} onChange={e=>setStPlan(e.target.value)}>
                <option value="">— اختياري —</option>
                {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
          </div>

          {/* اختيار مواد متعددة */}
          <div className="subjects-picker">
            <div className="picker-head">
              <span>المواد</span>
              <small>يمكن اختيار أكثر من مادة — ستظهر الأهداف حسب الصف</small>
            </div>
            <div className="chips">
              {allSubjects.map(s => {
                const active = selectedSubjects.includes(s.id)
                return (
                  <button
                    key={s.id}
                    className={'chip-btn ' + (active ? 'active':'')}
                    onClick={()=>toggleSubject(s.id)}
                    type="button"
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
            {selectedSubjects.length === 0 && (
              <div className="hint">اختاري مادة واحدة على الأقل.</div>
            )}
          </div>

          {/* قوائم الأهداف لكل مادة مختارة */}
          {selectedSubjects.map(sid => {
            const sub = allSubjects.find(s => s.id===sid)
            const goals = subjObjectives[sid] || []
            return (
              <div key={sid} className="subject-goals">
                <div className="sg-head">
                  <b>{sub?.name}</b>
                  <small>{stGrade==='' ? 'اختاري صفًا ليظهر بنك الأهداف' : `الأهداف المتوفرة لصف ${stGrade}`}</small>
                </div>

                {stGrade==='' ? (
                  <div className="hint">لا يمكن عرض الأهداف قبل اختيار الصف.</div>
                ) : goals.length === 0 ? (
                  <div className="hint">لا توجد أهداف لهذه المادة لهذا الصف.</div>
                ) : (
                  <div className="goals-list">
                    {goals.map(g => {
                      const chosen = (selectedObjIds[sid]?.has(g.id)) || false
                      return (
                        <label key={g.id} className={'goal-item ' + (chosen?'checked':'')}>
                          <input
                            type="checkbox"
                            checked={chosen}
                            onChange={()=>toggleObjective(sid, g.id)}
                          />
                          <span className="title">{g.title}</span>
                          <span className="desc">{g.description || ''}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <div className="actions-row">
            <button className="primary" disabled={adding || !stName.trim()} onClick={addStudent}>
              {adding ? 'Working…' : 'اضافة طالب'}
            </button>
          </div>

          <div className="divider" />

          <h4 className="list-title">طلابي</h4>
          {loadMyBusy && <div className="hint">Loading…</div>}
          {!loadMyBusy && (
            <div className="my-students">
              {myStudents.map(s => (
                <div className="chip" key={s.id}>
                  <div className="name">{s.full_name}</div>
                  <div className="meta">
                    <span>{s.grade!==null && s.grade!==undefined ? `صف ${s.grade}` : '—'}</span>
                    <span>• {(DISABILITIES.find(d=>d.value===s.disability)?.label) || '—'}</span>
                    <span>• {(PLAN_TYPES.find(p=>p.value===s.plan_type)?.label) || '—'}</span>
                  </div>
                </div>
              ))}
              {!myStudents.length && <div className="hint">لا يوجد طلاب لديك بعد.</div>}
            </div>
          )}
        </section>
      )}

      {/* ============== Dashboard (بدون تغيير) ============== */}
      {tab === 'dashboard' && (
        <div className="dashboard-area">
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
      )}
    </div>
  )
}
