// src/teacher/AddStudentForm.jsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { DISABILITIES, PLAN_TYPES, GRADES_FULL } from '../constants/school'

 export default function AddStudentForm({
   teacher, profile, allSubjects, initialSelectedSubjects = [],
   onSubjectsChange = () => {},
   onStudentAdded, myStudents, loadMyBusy
 }) {
  const [stName, setStName] = useState('')
  const [stGrade, setStGrade] = useState('')
  const [stDisability, setStDisability] = useState('')
  const [stPlan, setStPlan] = useState('')
  const [adding, setAdding] = useState(false)
  // const [selectedSubjects, setSelectedSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState(initialSelectedSubjects)
  const [subjObjectives, setSubjObjectives] = useState({})
  const [selectedObjIds, setSelectedObjIds] = useState({})

   // مزامنة لو تغيّر initialSelectedSubjects من الـ Dashboard بعد أول تحميل
 useEffect(() => { setSelectedSubjects(initialSelectedSubjects) }, [initialSelectedSubjects])

  async function loadObjectivesForSubject(subjectId, gradeVal) {
    if (!subjectId || gradeVal==='' || gradeVal===null || gradeVal===undefined) return
    const { data, error } = await supabase
      .from('objectives').select('id,title,description')
      .eq('subject_id', subjectId).eq('grade', Number(gradeVal))
      .order('created_at', { ascending:false })
    if (!error) setSubjObjectives(prev => ({ ...prev, [subjectId]: (data || []) }))
  }

  useEffect(() => { (async () => {
    for (const sid of selectedSubjects) await loadObjectivesForSubject(sid, stGrade)
  })() }, [stGrade]) // eslint-disable-line

  // function toggleSubject(subjectId) {
  //   setSelectedSubjects(prev => {
  //     const exists = prev.includes(subjectId)
  //     const next = exists ? prev.filter(x=>x!==subjectId) : [...prev, subjectId]
  //     if (!exists && stGrade!=='') loadObjectivesForSubject(subjectId, stGrade)
  //     return next
  //   })
  // }
  
   async function toggleSubject(subjectId) {
   setSelectedSubjects(prev => {
     const exists = prev.includes(subjectId)
     const next = exists ? prev.filter(x=>x!==subjectId) : [...prev, subjectId]
     return next
   })
   try {
     const exists = selectedSubjects.includes(subjectId)
     if (!exists) {
       // اربط المادة بالمعلّم
       await supabase.from('teacher_subjects')
         .upsert({ teacher_id: teacher?.id, subject_id: subjectId }, { onConflict: 'teacher_id,subject_id' })
       if (stGrade!=='') await loadObjectivesForSubject(subjectId, stGrade)
     } else {
       // فك الربط
       await supabase.from('teacher_subjects')
         .delete().eq('teacher_id', teacher?.id).eq('subject_id', subjectId)
       setSubjObjectives(prev => { const c={...prev}; delete c[subjectId]; return c })
       setSelectedObjIds(prev => { const c={...prev}; delete c[subjectId]; return c })
     }
     onSubjectsChange && onSubjectsChange(prev => {
       const existsNow = selectedSubjects.includes(subjectId)
       return existsNow
         ? prev.filter(x=>x!==subjectId)
         : [...prev, subjectId]
     })
   } catch (e) {
     console.error('link subject failed', e)
     alert('لم يتم حفظ اختيار المادة')
   }
 }

  function toggleObjective(subjectId, objectiveId) {
    setSelectedObjIds(prev => {
      const set = new Set(prev[subjectId] || [])
      if (set.has(objectiveId)) set.delete(objectiveId); else set.add(objectiveId)
      return { ...prev, [subjectId]: set }
    })
  }

  async function addStudent() {
    if (!stName.trim()) return
    try {
      setAdding(true)
      const payload = {
        full_name: stName.trim(),
        grade: stGrade === '' ? null : Number(stGrade),
        disability: stDisability || null,
        plan_type: stPlan || null,
        teacher_id: teacher?.id || null,
      }
      const { data: inserted, error } = await supabase.from('students').insert(payload).select('id').single()
      if (error) throw error
      const studentId = inserted.id

      const chosenIds = Object.values(selectedObjIds).flatMap(set => Array.from(set || []))
      if (chosenIds.length) {
        const rows = chosenIds.map(oid => ({ teacher_id: teacher?.id, student_id: studentId, objective_id: oid, achieved:'pending', notes:'' }))
        const { error: e2 } = await supabase.from('student_objectives_status').insert(rows)
        if (e2) throw e2
      }

      // تنظيف
      setStName(''); setStGrade(''); setStDisability(''); setStPlan('')
      setSelectedSubjects([]); setSubjObjectives({}); setSelectedObjIds({})
      onStudentAdded(studentId, selectedSubjects[0])
    } catch (e) { alert(e.message) } finally { setAdding(false) }
  }

  return (
        <section className="add-student-card">
          <h3>إضافة طالب جديد</h3>
          <div className="form-grid">
            <label className="field">
              <span>اسم الطالب</span>
              <input
                value={stName}
                onChange={e=>setStName(e.target.value)}
                placeholder="مثال: ليلى خالد"
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
             {/* معلّمك ومدرستك (للقراءة فقط) */}
   <label className="field">
     <span>المعلّم</span>
     <input value={profile?.full_name || '—'} disabled readOnly />
   </label>
   <label className="field">
     <span>المدرسة</span>
     <input value={profile?.school_name || '—'} disabled readOnly />
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
                    <span>• {profile?.full_name || '—'}</span>
                    <span>• {profile?.school_name || '—'}</span>
                  </div>
                </div>
              ))}
              {!myStudents.length && <div className="hint">لا يوجد طلاب لديك بعد.</div>}
            </div>
          )}
        </section>
  )
}
