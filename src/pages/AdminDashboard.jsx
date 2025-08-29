import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import '../styles/admin.scss'
import ConfirmModal from '../components/ConfirmModal'
import { IoIosRefresh } from "react-icons/io";

// ---------- constants ----------
export const DISABILITIES = [
  { value: 'none', label: 'بدون' },
  { value: 'visual', label: 'بصرية' },
  { value: 'hearing', label: 'سمعية' },
  { value: 'intellectual', label: 'ذهنية' },
  { value: 'autism', label: 'طيف التوحد' },
  { value: 'learning', label: 'صعوبات تعلم' },
  { value: 'speech', label: 'نطق/لغة' },
  { value: 'adhd', label: 'فرط حركة/نقص انتباه' },
  { value: 'physical', label: 'حركية' },
  { value: 'multiple', label: 'متعددة' },
  { value: 'other', label: 'أخرى' },
]

export const PLAN_TYPES = [
  { value: 'iep',      label: 'خطة فردية (IEP)' },
  { value: 'behavior', label: 'خطة سلوكية' },
  { value: 'remedial', label: 'خطة علاجية/تقوية' },
  { value: 'support',  label: 'خطة دعم' },
  { value: 'gifted',   label: 'خطة للموهوبين' },
  { value: 'rehab',    label: 'تأهيلية' },
  { value: 'other',    label: 'أخرى' },
]

// ============================================
// Admin Dashboard
// ============================================
export default function AdminDashboard() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('teachers')

  // ---------- lists ----------
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])

  // ---------- Assign tab state ----------
  const [assignTeacher, setAssignTeacher] = useState('')
  const [assignStudent, setAssignStudent] = useState('')
  const [selSubject, setSelSubject] = useState('')        // for assign
  const [assignObjectives, setAssignObjectives] = useState([])
  const [assignObjective, setAssignObjective] = useState('')
  const [assignBusy, setAssignBusy] = useState(false)

  // ---------- View (lists) drill-down ----------
  const [selTeacher, setSelTeacher] = useState('')
  const [tStudents, setTStudents] = useState([])
  const [selStudent, setSelStudent] = useState('')
  const [tSubjects, setTSubjects] = useState([])
  const [selSubj, setSelSubj] = useState('')
  const [assignRows, setAssignRows] = useState([])
  const [busyAssignTab, setBusyAssignTab] = useState(false)
  const [errAssignTab, setErrAssignTab] = useState('')

  // filters shown in Lists header (UI only for now)
  const [filterDisability, setFilterDisability] = useState('')
  const [filterPlan, setFilterPlan] = useState('')

  // ---------- Students inputs ----------
  const [studentName, setStudentName] = useState('')
  const [studentGrade, setStudentGrade] = useState('')
  const [studentTeacher, setStudentTeacher] = useState('')
  const [studentDisability, setStudentDisability] = useState('')
  const [studentPlan, setStudentPlan] = useState('')

  // ---------- Subjects input ----------
  const [newSubject, setNewSubject] = useState('')

  // ---------- Confirm modal ----------
  const [confirm, setConfirm] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
    working: false,
    onConfirm: null,
  })
  function openConfirm(opts) {
    setConfirm(prev => ({ ...prev, open: true, working: false, ...opts }))
  }
  function closeConfirm() {
    setConfirm(prev => ({ ...prev, open: false, working: false, onConfirm: null }))
  }
  async function runConfirm() {
    if (!confirm.onConfirm) return
    try {
      setConfirm(prev => ({ ...prev, working: true }))
      await confirm.onConfirm()
      closeConfirm()
    } catch {
      setConfirm(prev => ({ ...prev, working: false }))
    }
  }

  // ---------- BANK tab (Subjects -> Grades -> Objectives) ----------
  const GRADES_FULL = [{ v: 0, t: 'روضة' }, ...Array.from({ length: 12 }, (_, i) => ({ v: i + 1, t: `${i + 1}` }))]
  const [bankSubject, setBankSubject] = useState('')
  const [bankGrade, setBankGrade] = useState(null) // 0..12
  const [bankObjectives, setBankObjectives] = useState([])
  const [bankTitle, setBankTitle] = useState('')
  const [bankDesc, setBankDesc] = useState('')
  const [bankBusy, setBankBusy] = useState(false)
  const [bankErr, setBankErr] = useState('')

  async function loadBankObjectives(subjectId, gradeVal) {
    if (!subjectId || gradeVal === null || gradeVal === undefined) { setBankObjectives([]); return }
    try {
      setBankBusy(true); setBankErr('')
      const { data, error } = await supabase
        .from('objectives')
        .select('id, title, description, subject_id, grade, created_at')
        .eq('subject_id', subjectId)
        .eq('grade', gradeVal)
        .order('created_at', { ascending: false })
      if (error) throw error
      setBankObjectives(data || [])
    } catch (e) {
      setBankErr(e.message || 'Failed to load objectives')
      setBankObjectives([])
    } finally { setBankBusy(false) }
  }

  async function addBankObjective() {
    if (!bankSubject || bankGrade === null || !bankTitle.trim()) return
    try {
      setBankBusy(true); setBankErr('')
      const { error } = await supabase.from('objectives').insert({
        subject_id: bankSubject,
        title: bankTitle.trim(),
        description: bankDesc || null,
        grade: bankGrade,
      })
      if (error) throw error
      setBankTitle(''); setBankDesc('')
      await loadBankObjectives(bankSubject, bankGrade)
    } catch (e) {
      setBankErr(e.message || 'Failed to add')
    } finally { setBankBusy(false) }
  }

  async function delBankObjective(id) {
    try {
      setBankBusy(true); setBankErr('')
      const { error } = await supabase.from('objectives').delete().eq('id', id)
      if (error) throw error
      await loadBankObjectives(bankSubject, bankGrade)
    } catch (e) {
      setBankErr(e.message || 'Failed to delete')
    } finally { setBankBusy(false) }
  }

  // ---------- load master lists ----------
  useEffect(() => { (async () => { await Promise.all([loadTeachers(), loadSubjects(), loadStudents()]) })() }, [])

  // default selected subject for Assign (optional)
  useEffect(() => {
    if (!selSubject && subjects.length) setSelSubject(subjects[0].id)
  }, [subjects, selSubject])

  // load objectives list for Assign whenever subject changes
  useEffect(() => {
    if (selSubject) loadAssignObjectives(selSubject)
    else setAssignObjectives([])
  }, [selSubject])

  async function loadTeachers() {
    // fetch teachers + count of their students (via students table)
    const { data: teachersData, error: e1 } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })
    if (e1) { setTeachers([]); return }

    const { data: studCounts, error: e2 } = await supabase
      .from('students').select('teacher_id, id')
    if (e2) { setTeachers(teachersData || []); return }

    const countMap = new Map()
    for (const s of (studCounts || [])) {
      if (!s.teacher_id) continue
      countMap.set(s.teacher_id, (countMap.get(s.teacher_id) || 0) + 1)
    }
    setTeachers((teachersData || []).map(t => ({ ...t, student_count: countMap.get(t.id) || 0 })))
  }

  async function loadSubjects() {
    const { data, error } = await supabase.from('subjects').select('*').order('name')
    if (!error) setSubjects(data || [])
  }

  async function loadStudents() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id, full_name, grade, disability, plan_type, teacher_id,
        teacher:profiles!students_teacher_id_fkey (id, full_name)
      `)
      .order('full_name', { ascending: true })
    if (error) { setStudents([]); return }
    setStudents(data || [])
  }

  // objectives for Assign select (no Objectives tab anymore)
  async function loadAssignObjectives(subjectId) {
    const { data, error } = await supabase
      .from('objectives')
      .select('id, title')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })
    if (!error) setAssignObjectives(data || [])
  }

  // ---------- Lists drill-down data ----------
  useEffect(() => {
    if (!selTeacher) { setTStudents([]); return }
    (async () => {
      try {
        setBusyAssignTab(true); setErrAssignTab('')
        const { data: studs, error } = await supabase
          .from('students')
          .select('id, full_name')
          .eq('teacher_id', selTeacher)
          .order('full_name', { ascending: true })
        if (error) throw error
        setTStudents(studs || [])
      } catch (e) {
        setErrAssignTab(e.message); setTStudents([])
      } finally { setBusyAssignTab(false) }
    })()
  }, [selTeacher])

  useEffect(() => {
    if (!selTeacher || !selStudent) { setTSubjects([]); return }
    (async () => {
      try {
        setBusyAssignTab(true); setErrAssignTab('')
        const { data: sos, error } = await supabase
          .from('student_objectives_status')
          .select('objective_id')
          .eq('teacher_id', selTeacher)
          .eq('student_id', selStudent)
        if (error) throw error

        const objIds = [...new Set((sos || []).map(r => r.objective_id))]
        if (objIds.length === 0) { setTSubjects([]); return }

        const { data: objs, error: e2 } = await supabase
          .from('objectives').select('id, subject_id').in('id', objIds)
        if (e2) throw e2

        const subjIds = [...new Set((objs || []).map(o => o.subject_id))]
        if (subjIds.length === 0) { setTSubjects([]); return }

        const { data: subs, error: e3 } = await supabase
          .from('subjects').select('id, name').in('id', subjIds).order('name', { ascending: true })
        if (e3) throw e3
        setTSubjects(subs || [])
      } catch (e) {
        setErrAssignTab(e.message); setTSubjects([])
      } finally { setBusyAssignTab(false) }
    })()
  }, [selTeacher, selStudent])

  useEffect(() => {
    if (!selTeacher || !selStudent || !selSubj) { setAssignRows([]); return }
    refreshAssignments()
  }, [selTeacher, selStudent, selSubj])

  async function refreshAssignments() {
    try {
      setBusyAssignTab(true); setErrAssignTab('')
      const { data: sos, error } = await supabase
        .from('student_objectives_status')
        .select('objective_id, achieved, notes')
        .eq('teacher_id', selTeacher)
        .eq('student_id', selStudent)
      if (error) throw error

      const objIds = (sos || []).map(r => r.objective_id)
      const { data: subjectObjs, error: e2 } = await supabase
        .from('objectives')
        .select('id, title, description')
        .eq('subject_id', selSubj)
        .order('created_at', { ascending: false })
      if (e2) throw e2

      const assignedMap = new Map((sos || []).map(r => [r.objective_id, r]))
      const rows = (subjectObjs || [])
        .filter(o => assignedMap.has(o.id))
        .map(o => ({
          objective_id: o.id,
          objective: o,
          achieved: assignedMap.get(o.id)?.achieved || 'pending',
          notes: assignedMap.get(o.id)?.notes || ''
        }))
      setAssignRows(rows)
    } catch (e) {
      setErrAssignTab(e.message); setAssignRows([])
    } finally { setBusyAssignTab(false) }
  }

  async function updateStatus(objectiveId, newStatus) {
    try {
      const { error } = await supabase
        .from('student_objectives_status')
        .update({ achieved: newStatus })
        .eq('teacher_id', selTeacher)
        .eq('student_id', selStudent)
        .eq('objective_id', objectiveId)
      if (error) throw error
      setAssignRows(rows => rows.map(r => r.objective_id === objectiveId ? { ...r, achieved: newStatus } : r))
    } catch (e) {
      alert(e.message)
    }
  }

  let notesTimer
  function updateNotesDebounced(objectiveId, val) {
    setAssignRows(rows => rows.map(r => r.objective_id === objectiveId ? { ...r, notes: val } : r))
    clearTimeout(notesTimer)
    notesTimer = setTimeout(async () => {
      try {
        await supabase
          .from('student_objectives_status')
          .update({ notes: val })
          .eq('teacher_id', selTeacher)
          .eq('student_id', selStudent)
          .eq('objective_id', objectiveId)
      } catch (e) {
        console.error(e)
      }
    }, 500)
  }

  async function removeAssignment(objectiveId) {
    const { error } = await supabase
      .from('student_objectives_status')
      .delete()
      .eq('teacher_id', selTeacher)
      .eq('student_id', selStudent)
      .eq('objective_id', objectiveId)
    if (error) return alert(error.message)
    setAssignRows(rows => rows.filter(r => r.objective_id !== objectiveId))
  }

  // ---------- CRUD: subjects/students ----------
  async function addSubject() {
    if (!newSubject.trim()) return
    const { error } = await supabase.from('subjects').insert({ name: newSubject.trim() })
    if (error) return alert(error.message)
    setNewSubject(''); loadSubjects()
  }
  async function delSubject(id) {
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) return alert(error.message)
    loadSubjects()
  }

  async function addStudent() {
    if (!studentName.trim()) return
    const payload = {
      full_name: studentName.trim(),
      grade: studentGrade || null,
      teacher_id: studentTeacher || null,
      disability: studentDisability || null,
      plan_type: studentPlan || null,
    }
    const { error } = await supabase.from('students').insert(payload)
    if (error) return alert(error.message)
    setStudentName(''); setStudentGrade(''); setStudentTeacher('')
    setStudentDisability(''); setStudentPlan('')
    loadStudents()
  }
  async function delStudent(id) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) return alert(error.message)
    loadStudents()
  }

  // ---------- assign ----------
  async function assign() {
    if (!assignTeacher) return alert('اختر المعلم')
    if (!assignStudent) return alert('اختر الطالب')
    if (!selSubject) return alert('اختر المادة')
    if (!assignObjective) return alert('اختر الهدف')

    setAssignBusy(true)
    try {
      const payload = {
        teacher_id: assignTeacher,
        student_id: assignStudent,
        objective_id: assignObjective,
        achieved: 'pending',
        notes: '',
      }
      const { error } = await supabase
        .from('student_objectives_status')
        .upsert(payload, { onConflict: 'student_id,objective_id,teacher_id' })
      if (error) throw error
      setAssignObjective('')
    } catch (e) {
      alert(e.message)
    } finally { setAssignBusy(false) }
  }

  // ---------- counts ----------
  const teachersCount = teachers.length
  const subjectsCount = subjects.length
  const studentsCount = students.length

  return (
    <div className="admin-hero" dir="rtl" lang="ar">
      <div className="admin-card">
        <div className="admin-header">
          <h2>لوحة تحكم المسؤول</h2>
          <div className="tools">
            <button onClick={() => signOut()}>تسجيل الخروج</button>
          </div>
        </div>

        <div className="tabs">
          <button className={tab==='teachers'?'active':''} onClick={()=>setTab('teachers')}>المعلمين ({teachersCount})</button>
          <button className={tab==='subjects'?'active':''} onClick={()=>setTab('subjects')}>المواد ({subjectsCount})</button>
          <button className={tab==='students'?'active':''} onClick={()=>setTab('students')}>الطلاب ({studentsCount})</button>
          <button className={tab==='assign'?'active':''} onClick={()=>setTab('assign')}>تعيين</button>
          <button className={tab==='view'?'active':''} onClick={()=>setTab('view')}>القوائم</button>
          <button className={tab==='bank'?'active':''} onClick={()=>setTab('bank')}>بنك الأهداف</button>
        </div>

        {/* TEACHERS */}
        {tab === 'teachers' && (
          <section className="panel">
            <h3 className="table-title">المعلمين المسجلين</h3>
            <div className="table-container">
              <table className="styled-table">
                <thead>
                  <tr><th>الأسم</th><th>ID</th><th>عدد الطلاب</th><th></th></tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr><td colSpan={4} style={{textAlign:'center',opacity:.7}}>لا يوجد معلمين بعد.</td></tr>
                  ) : teachers.map(t => (
                    <tr key={t.id}>
                      <td>{t.full_name || '—'}</td>
                      <td><code>{t.id}</code></td>
                      <td><span className="pill pill-count">{t.student_count ?? 0}</span></td>
                      <td><span className={`role-badge ${t.role}`}>{t.role}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SUBJECTS */}
        {tab === 'subjects' && (
          <section className="panel">
            <div className="panel-header">
              <div className="title"><span>المواد</span><span className="muted">({subjects.length})</span></div>
              <div className="tools">
                <input placeholder="اسم المادة الجديدة" value={newSubject} onChange={e=>setNewSubject(e.target.value)} />
                <button onClick={()=>openConfirm({
                  title: 'Add subject',
                  message: `Add subject "${newSubject}"؟`,
                  confirmLabel: 'Add',
                  onConfirm: async () => { await addSubject() },
                })}>اضافة مادة</button>
                <button className="ghost" onClick={loadSubjects}><IoIosRefresh /></button>
              </div>
            </div>
            <table className="styled-table">
              <thead><tr><th>المادة</th><th style={{width:120,textAlign:'right'}}></th></tr></thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr><td colSpan={2} style={{textAlign:'center',opacity:.7}}>لا يوجد مواد بعد</td></tr>
                ) : subjects.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="danger" onClick={() => openConfirm({
                        title:'Delete subject', message:'Are you sure?', confirmLabel:'Delete', danger:true,
                        onConfirm: async () => { await delSubject(s.id) },
                      })}>حذف المادة</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* STUDENTS */}
        {tab === 'students' && (
          <section className="panel">
            <div className="panel-header">
              <div className="title"><span>الطلاب</span><span className="muted">({students.length})</span></div>
              <div className="tools">
                <input placeholder="اسم الطالب الكامل" value={studentName} onChange={e=>setStudentName(e.target.value)} />
                <input placeholder="الصف (اختياري)" value={studentGrade} onChange={e=>setStudentGrade(e.target.value)} />
                <select value={studentTeacher || ''} onChange={e=>setStudentTeacher(e.target.value)}>
                  <option value="">— لا يوجد معلم —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
                <select value={studentDisability} onChange={e=>setStudentDisability(e.target.value)}>
                  <option value="">الإعاقة (اختياري)</option>
                  {DISABILITIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <select value={studentPlan} onChange={e=>setStudentPlan(e.target.value)}>
                  <option value="">نوع الخطة (اختياري)</option>
                  {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button onClick={() => openConfirm({
                  title:'اضافة طالب', message:`اضافة الطالب ${studentName}؟`, confirmLabel:'اضافة طالب',
                  onConfirm: async () => { await addStudent() },
                })}>اضافة طالب</button>
                <button className="ghost" onClick={loadStudents}><IoIosRefresh /></button>
              </div>
            </div>

            <table className="styled-table">
              <thead>
                <tr>
                  <th>اسم الطالب</th>
                  <th>الصف</th>
                  <th>المعلم</th>
                  <th>الإعاقة</th>
                  <th>نوع الخطة</th>
                  <th style={{width:120,textAlign:'right'}}></th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center',opacity:.7}}>لا يوجد طلاب بعد.</td></tr>
                ) : students.map(s => (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td>{s.grade || '—'}</td>
                    <td>{(() => {
                      const t = teachers.find(x => x.id === s.teacher_id)
                      return t ? (t.full_name || '—') : '—'
                    })()}</td>
                    <td>{(DISABILITIES.find(d => d.value === s.disability)?.label) || '—'}</td>
                    <td>{(PLAN_TYPES.find(p => p.value === s.plan_type)?.label) || '—'}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="danger" onClick={() => openConfirm({
                        title:'حذف الطالب', message:'هل انت متأكد؟', confirmLabel:'حذف', danger:true,
                        onConfirm: async () => { await delStudent(s.id) },
                      })}>حذف الطالب</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* LISTS */}
        {tab === 'view' && (
          <section className="panel">
            <div className="panel-header">
              <div className="title">
                <span>القوائم</span>
                <span className="muted">استعراض الأهداف المسندة وتحديث حالتها</span>
              </div>
              <div className="tools lists-tools">
                <select value={selTeacher} onChange={e=>{ setSelTeacher(e.target.value); setSelStudent(''); setSelSubj(''); setAssignRows([]) }}>
                  <option value="">اختر معلماً</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.id}</option>)}
                </select>
                <select value={selStudent} onChange={e=>{ setSelStudent(e.target.value); setSelSubj(''); setAssignRows([]) }} disabled={!selTeacher || tStudents.length===0}>
                  <option value="">اختر طالباً</option>
                  {tStudents.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <select value={selSubj} onChange={e=>setSelSubj(e.target.value)} disabled={!selTeacher || !selStudent || tSubjects.length===0}>
                  <option value="">اختر مادة</option>
                  {tSubjects.map(su => <option key={su.id} value={su.id}>{su.name}</option>)}
                </select>

                {/* <select value={filterDisability} onChange={e=>setFilterDisability(e.target.value)}>
                  <option value="">كل الإعاقات</option>
                  {DISABILITIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <select value={filterPlan} onChange={e=>setFilterPlan(e.target.value)}>
                  <option value="">كل الخطط</option>
                  {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select> */}

                <button className="ghost" onClick={refreshAssignments}><IoIosRefresh /></button>
              </div>
            </div>

            {busyAssignTab && <div style={{paddingTop:8}}>تحميل...</div>}
            {errAssignTab && <div style={{paddingTop:8,color:'#f88'}}>Error: {errAssignTab}</div>}

            {(selTeacher && selStudent && selSubj) && (
              <div className="table-wrap">
                <table className="styled-table lists-table">
                  <thead>
                    <tr>
                      <th>الأهداف</th>
                      <th>حالة الهدف</th>
                      <th>ملاحظات</th>
                      <th style={{textAlign:'center'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignRows.length === 0 ? (
                      <tr><td colSpan={4} style={{textAlign:'center',opacity:.7}}>لا توجد أهداف مُسنّدة لهذه المادة.</td></tr>
                    ) : assignRows.map(row => (
                      <tr key={row.objective_id}>
                        <td>
                          <div className="cell-main"><span className="dot" /><span className="text">{row.objective?.title}</span></div>
                        </td>
                        <td>
                          <select value={row.achieved || 'pending'} onChange={e=>updateStatus(row.objective_id, e.target.value)}>
                            <option value="pending">قيد الانتظار</option>
                            <option value="done">منتهية</option>
                            <option value="na">لم يتم بعد</option>
                          </select>
                        </td>
                        <td>
                          <input value={row.notes || ''} onChange={e=>updateNotesDebounced(row.objective_id, e.target.value)} placeholder="notes…" />
                        </td>
                        <td style={{textAlign:'center'}}>
                          <button className="danger" onClick={()=>openConfirm({
                            title:'حذف الهدف', message:'هل انت متأكد من انك تريد حذف هذا الهدف من عند الطالب؟', confirmLabel:'حذف', danger:true,
                            onConfirm: async () => { await removeAssignment(row.objective_id) },
                          })}>حذف الهدف من هذا الطالب </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ASSIGN */}
        {tab === 'assign' && (
          <section className="panel">
            <div className="panel-header">
              <div className="title"><span>تعيين</span><span className="muted">اسندي هدفًا لطالب مع معلّم</span></div>
              <div className="tools assign-tools">
                <select value={assignTeacher} onChange={e=>setAssignTeacher(e.target.value)}>
                  <option value="">اختر معلماً</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || '—'}</option>)}
                </select>
                <select value={assignStudent} onChange={e=>setAssignStudent(e.target.value)}>
                  <option value="">اختر طالباً</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <select value={selSubject || ''} onChange={e=>setSelSubject(e.target.value)}>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={assignObjective} onChange={e=>setAssignObjective(e.target.value)}>
               <option value="">اختر مادة</option>
                  {assignObjectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
                <button disabled={assignBusy} onClick={() => openConfirm({
                  title:'تعيين هدف', message:'تعيين الهدف الى الطالب؟', confirmLabel:'تعيين',
                  onConfirm: async () => { await assign() },
                })}>{assignBusy ? 'Working…' : 'تعيين الهدف'}</button>
              </div>
            </div>
            <p className="section-title" style={{opacity:.8, marginTop:0}}>اختر المعلّم ثم الطالب والمادة والهدف واضغطي <b>Assign</b>.</p>
          </section>
        )}

        {/* BANK */}
        {tab === 'bank' && (
          <section className="panel">
            <div className="panel-header">
              <div className="title"><span>بنك الأهداف</span><span className="muted">إدارة الأهداف لكل المواد و الصفوف</span></div>
              <div className="tools">
                <select value={bankSubject || ''} onChange={e=>{ setBankSubject(e.target.value); setBankGrade(null); setBankObjectives([]) }}>
                  <option value="">اختر مادة</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button className="ghost" onClick={()=>loadBankObjectives(bankSubject, bankGrade)} disabled={!bankSubject || bankGrade===null}><IoIosRefresh /></button>
              </div>
            </div>

            {bankSubject ? (
              <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'8px 0 4px'}}>
                {GRADES_FULL.map(g => (
                  <button key={g.v} className={bankGrade===g.v?'active':''}
                    onClick={()=>{ setBankGrade(g.v); loadBankObjectives(bankSubject, g.v) }}
                    style={{ borderRadius:12,padding:'8px 12px', background:bankGrade===g.v?'#7c3aed':'transparent', border:'1px solid #ffffff22', color:'#fff' }}>
                    الصف {g.t}
                  </button>
                ))}
              </div>
            ) : <div style={{opacity:.8}}>اختر مادة لعرض الصفوف…</div>}

            {(bankSubject && bankGrade!==null) && (
              <div className="tools" style={{marginTop:12}}>
                <input placeholder="Objective title" value={bankTitle} onChange={e=>setBankTitle(e.target.value)} />
                <input placeholder="Description (optional)" value={bankDesc} onChange={e=>setBankDesc(e.target.value)} />
                <button onClick={addBankObjective} disabled={bankBusy || !bankTitle.trim()}>{bankBusy ? 'Working…' : 'اضافة هدف'}</button>
              </div>
            )}

            {bankBusy && <div style={{paddingTop:8}}>تحميل...</div>}
            {bankErr && <div style={{paddingTop:8,color:'#f88'}}>Error: {bankErr}</div>}

            {(bankSubject && bankGrade!==null) && (
              <div className="table-wrap" style={{marginTop:12}}>
                <table className="styled-table">
                  <thead><tr><th>عنوان الهدف</th><th>ملاحظات</th><th style={{width:120,textAlign:'right'}}></th></tr></thead>
                  <tbody>
                    {bankObjectives.length === 0 ? (
                      <tr><td colSpan={3} style={{textAlign:'center',opacity:.7}}>لا توجد أهداف لهذه المادة في هذا الصف.</td></tr>
                    ) : bankObjectives.map(o => (
                      <tr key={o.id}>
                        <td style={{textAlign:'left',display:'flex',alignItems:'center',gap:10}}>
                          <span style={{width:8,height:8,borderRadius:999,background:'#8b5cf6',boxShadow:'0 0 0 3px rgba(139,92,246,.15)',flex:'0 0 8px'}} />
                          <span title={o.title} style={{fontWeight:600}}>{o.title}</span>
                        </td>
                        <td>{o.description || '—'}</td>
                        <td style={{textAlign:'right'}}>
                          <button className="danger" onClick={() => openConfirm({
                            title:'حذف الهدف', message:'هل انت متأكد انك تريد حذف هذا الهدف؟', confirmLabel:'حذف', danger:true,
                            onConfirm: async () => { await delBankObjective(o.id) },
                          })}>حذف الهدف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        working={confirm.working}
        onConfirm={runConfirm}
        onClose={closeConfirm}
      />
    </div>
  )
}
