import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { DISABILITIES, PLAN_TYPES, GRADES_FULL } from '../constants/school'

export default function EditStudentPanel({ teacherId, selStudent, allSubjects, onChanged }) {
  // فتح/إغلاق المودال
  const STORAGE_KEY = 'editStudentOpen'

const [open, setOpen] = useState(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved ? JSON.parse(saved) : false
})

// كل ما تتغير، خزّن
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(open))
}, [open])

// لما يتغيّر الطالب، ما نفتح تلقائيًا (بنحترم المحفوظ لكن من المنطقي نغلق عند تغيير الطالب)
// إذا بدك تضلّي على نفس الحالة بالضبط حتى مع تغيير الطالب، احذفي السطر اللي بسكّر
useEffect(() => {
  // سكّريه عند تغيير الطالب (اختياري)
  setOpen(false)
  // ... والباقي من reset اللي عندك موجود أساسًا
}, [selStudent])


  // معلومات الطالب
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('') // KG1=0, KG2=-1, ثم 1..12
  const [editDisability, setEditDisability] = useState('')
  const [editPlan, setEditPlan] = useState('')
  const [updating, setUpdating] = useState(false)

  // إضافة مواد/أهداف
  const [editSelSubjects, setEditSelSubjects] = useState([])         // ids
  const [editSubjObjectives, setEditSubjObjectives] = useState({})   // {sid: [{id,title,description}]}
  const [editSelectedObjIds, setEditSelectedObjIds] = useState({})   // {sid: Set(ids)}
  const [assignedIds, setAssignedIds] = useState(new Set())          // أهداف مُسنّدة مسبقًا

  // عند تغيير الطالب: نظّف واملأ البيانات
  useEffect(() => {
    setOpen(false)
    setEditName(''); setEditGrade(''); setEditDisability(''); setEditPlan('')
    setEditSelSubjects([]); setEditSubjObjectives({}); setEditSelectedObjIds({})
    setAssignedIds(new Set())

    if (!selStudent) return
    ;(async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, grade, disability, plan_type')
        .eq('id', selStudent)
        .single()
      if (!error && data) {
        setEditName(data.full_name || '')
        setEditGrade(data.grade ?? '')
        setEditDisability(data.disability || '')
        setEditPlan(data.plan_type || '')
      }
    })()
  }, [selStudent])

  async function saveStudentEdits() {
    if (!selStudent) return
    try {
      setUpdating(true)
      const payload = {
        full_name: editName.trim(),
        grade: editGrade === '' ? null : Number(editGrade),
        disability: editDisability || null,
        plan_type: editPlan || null,
      }
      const { error } = await supabase.from('students').update(payload).eq('id', selStudent)
      if (error) throw error
      onChanged?.()
    } catch (e) {
      alert(e.message)
    } finally {
      setUpdating(false)
    }
  }

  async function loadAssignedForSubject(subjectId) {
    const { data, error } = await supabase
      .from('student_objectives_status')
      .select('objective_id, objective:objectives!inner(subject_id)')
      .eq('teacher_id', teacherId)
      .eq('student_id', selStudent)
      .eq('objective.subject_id', subjectId)
    if (!error) {
      const ids = new Set((data || []).map(r => r.objective_id))
      setAssignedIds(prev => new Set([...prev, ...ids]))
    }
  }

  async function loadEditObjectivesForSubject(subjectId) {
    if (!subjectId || editGrade === '' || editGrade === null || editGrade === undefined) return
    const { data, error } = await supabase
      .from('objectives')
      .select('id, title, description')
      .eq('subject_id', subjectId)
      .eq('grade', Number(editGrade))
      .order('created_at', { ascending: false })
    if (!error) {
      setEditSubjObjectives(prev => ({ ...prev, [subjectId]: (data || []) }))
      await loadAssignedForSubject(subjectId)
    }
  }

  function toggleEditSubject(subjectId) {
    setEditSelSubjects(prev => {
      const exists = prev.includes(subjectId)
      const next = exists ? prev.filter(x => x !== subjectId) : [...prev, subjectId]
      if (!exists && editGrade !== '') loadEditObjectivesForSubject(subjectId)
      return next
    })
  }

  function toggleEditObjective(subjectId, objectiveId) {
    setEditSelectedObjIds(prev => {
      const set = new Set(prev[subjectId] || [])
      if (set.has(objectiveId)) set.delete(objectiveId)
      else set.add(objectiveId)
      return { ...prev, [subjectId]: set }
    })
  }

  async function addObjectivesToStudent() {
    if (!selStudent) return
    const chosen = Object.values(editSelectedObjIds).flatMap(set => Array.from(set || []))
    const newIds = chosen.filter(id => !assignedIds.has(id))
    if (!newIds.length) { setOpen(false); return }

    const rows = newIds.map(oid => ({
      teacher_id: teacherId,
      student_id: selStudent,
      objective_id: oid,
      achieved: 'pending',
      notes: ''
    }))
    const { error } = await supabase
      .from('student_objectives_status')
      .upsert(rows, { onConflict: 'student_id,objective_id,teacher_id' })
    if (error) return alert(error.message)

    setEditSelSubjects([])
    setEditSubjObjectives({})
    setEditSelectedObjIds({})
    setAssignedIds(new Set())
    onChanged?.()
    setOpen(false)
  }

  return (
    <section className="es-panel">
      <div className="es-header">
        <div className="es-title">
          <span>تعديل بيانات الطالب:</span>
          <span className="es-name">{editName || 'الطالب المحدّد'}</span>
        </div>
        <div className="es-tools">
          <button className="es-ghost-btn" onClick={() => setOpen(true)}>فتح التعديل</button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="es-modal-overlay" onClick={() => setOpen(false)}>
          <div className="es-modal" onClick={e => e.stopPropagation()}>
            <button className="es-modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>

            <h3>بيانات الطالب</h3>
            <div className="es-form-grid">
              <label className="es-field">
                <span>اسم الطالب</span>
                <input value={editName} onChange={e=>setEditName(e.target.value)} />
              </label>

              <label className="es-field">
                <span>الصف</span>
                <select value={editGrade} onChange={e=>setEditGrade(e.target.value)}>
                  <option value="">— اختاري —</option>
                  {GRADES_FULL.map(g => <option key={g.v} value={g.v}>{g.t}</option>)}
                </select>
              </label>

              <label className="es-field">
                <span>الإعاقة</span>
                <select value={editDisability} onChange={e=>setEditDisability(e.target.value)}>
                  <option value="">— اختياري —</option>
                  {DISABILITIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </label>

              <label className="es-field">
                <span>نوع الخطة</span>
                <select value={editPlan} onChange={e=>setEditPlan(e.target.value)}>
                  <option value="">— اختياري —</option>
                  {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
            </div>

            <div className="es-actions">
              <button className="es-primary" disabled={updating || !editName.trim()} onClick={saveStudentEdits}>
                {updating ? 'Working…' : 'حفظ بيانات الطالب'}
              </button>
            </div>

            <div className="es-divider" />

            <div className="es-subjects">
              <div className="es-subjects-head">
                <span>إضافة مواد/أهداف</span>
                <small>اختاري مادة (أو أكثر) — تظهر الأهداف حسب الصف المختار أعلاه</small>
              </div>
              <div className="es-chips">
                {allSubjects.map(s => {
                  const active = editSelSubjects.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      className={'es-chip ' + (active ? 'active' : '')}
                      onClick={() => toggleEditSubject(s.id)}
                      type="button"
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
              {editSelSubjects.length === 0 && <div className="es-hint">اختاري على الأقل مادة واحدة.</div>}
            </div>

            {editSelSubjects.map(sid => {
              const sub = allSubjects.find(s => s.id === sid)
              const goals = editSubjObjectives[sid] || []
              return (
                <div key={sid} className="es-subject-goals">
                  <div className="es-sg-head">
                    <b>{sub?.name}</b>
                    <small>{editGrade === '' ? 'اختاري صفًا أولًا' : `الأهداف المتوفرة لصف ${editGrade}`}</small>
                  </div>

                  {editGrade === '' ? (
                    <div className="es-hint">لا يمكن عرض الأهداف قبل اختيار الصف.</div>
                  ) : goals.length === 0 ? (
                    <div className="es-hint">لا توجد أهداف لهذه المادة لهذا الصف.</div>
                  ) : (
                    <div className="es-goals">
                      {goals.map(g => {
                        const already = assignedIds.has(g.id)
                        const chosen = (editSelectedObjIds[sid]?.has(g.id)) || false
                        return (
                          <label key={g.id} className={'es-goal ' + (chosen ? 'checked' : '')} title={already ? 'مُسنّد مسبقًا' : ''}>
                            <input
                              type="checkbox"
                              checked={chosen}
                              disabled={already}
                              onChange={() => toggleEditObjective(sid, g.id)}
                            />
                            <span className="title">{g.title}</span>
                            <span className="desc">{already ? '— مُسنّد' : (g.description || '')}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="es-actions">
              <button className="es-primary" onClick={addObjectivesToStudent}>إسناد الأهداف المختارة</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
