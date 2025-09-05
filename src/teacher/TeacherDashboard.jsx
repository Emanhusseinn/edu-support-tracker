// src/teacher/TeacherDashboard.jsx
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../supabaseClient'
import ExportStudentReport from './ExportStudentReport'
import '../styles/teacher.scss'
// import { DISABILITIES, PLAN_TYPES, GRADES_FULL } from '../constants/school'
import useRealtimeSOS from '../hooks/useRealtimeSOS'
import useSubjectsByTeacher from '../hooks/useSubjectsByTeacher'
import useStudentsBySubject from '../hooks/useStudentsBySubject'
import useObjectivesBoard from '../hooks/useObjectivesBoard'
import useMyStudents from '../hooks/useMyStudents'

import TeacherHeader from './TeacherHeader'
import Tabs from './Tabs'
import SubjectCards from './SubjectCards'
import StudentsList from './StudentsList'
import StatusBoard from './StatusBoard'
import AddStudentForm from './AddStudentForm'
import EditStudentPanel from './EditStudentPanel'

export default function TeacherDashboard() {
  const { user, profile, signOut } = useAuth()
  const [allSubjects, setAllSubjects] = useState([])
  const [mySubjectIds, setMySubjectIds] = useState([])
  const [loadingSubs, setLoadingSubs] = useState(true)

    useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingSubs(true)
      const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from('subjects').select('id,name').order('name'),
        supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', user.id),
      ])
      setAllSubjects(all || [])
      setMySubjectIds((mine || []).map(r => r.subject_id))
      setLoadingSubs(false)
    })()
  }, [user?.id])
// بدل:
 // const [tab, setTab] = useState('add')
 // const [selSubject, setSelSubject] = useState(null)
 // const [selStudent, setSelStudent] = useState(null)

// إلى:
const [tab, setTab] = useState(() => localStorage.getItem('teacherTab') || 'dashboard')
const [selSubject, setSelSubject] = useState(() => {
  const v = localStorage.getItem('teacherSelSubject')
  return v ? JSON.parse(v) : null
})
const [selStudent, setSelStudent] = useState(() => {
  const v = localStorage.getItem('teacherSelStudent')
  return v ? JSON.parse(v) : null
})

useEffect(() => {
  localStorage.setItem('teacherTab', tab)
}, [tab])

useEffect(() => {
  if (selSubject) localStorage.setItem('teacherSelSubject', JSON.stringify(selSubject))
}, [selSubject])

useEffect(() => {
  if (selStudent) localStorage.setItem('teacherSelStudent', JSON.stringify(selStudent))
}, [selStudent])



  const [refreshTick, setRefreshTick] = useState(0)

  // subjects
  const { loading, subjects } = useSubjectsByTeacher(user?.id, [refreshTick])

useEffect(() => {
  if (subjects.length === 0) return
  // إذا في قيمة محفوظة بالـ localStorage استخدميها، غير هيك اختاري أول مادة
  const saved = localStorage.getItem('teacherSelSubject')
  if (saved) {
    const savedId = JSON.parse(saved)
    // تأكدي إنها لسه موجودة ضمن المواد
    if (subjects.some(s => s.id === savedId)) {
      if (selSubject !== savedId) setSelSubject(savedId)
      return
    }
  }
  if (!selSubject) setSelSubject(subjects[0].id)
}, [subjects])  


  // students for selected subject
  const students = useStudentsBySubject(user?.id, selSubject, [refreshTick])
  // اختاري أول طالب دائماً عند تغيّر قائمة الطلاب أو تغيّر المادة
useEffect(() => {
  if (!students || students.length === 0) return

  const saved = localStorage.getItem('teacherSelStudent')
  if (saved) {
    const savedId = JSON.parse(saved)
    // إذا الطالب المحفوظ موجود ضمن القائمة الحالية، خليه
    if (students.some(st => st.id === savedId)) {
      if (selStudent !== savedId) setSelStudent(savedId)
      return
    }
  }
  // غير هيك، أول طالب
  if (!selStudent) setSelStudent(students[0].id)
}, [students])  // خليه يعتمد فقط على students


  // board objectives
  const [objectives, setObjectives] = useObjectivesBoard(user?.id, selSubject, selStudent, [tab, refreshTick])

  // my students for Add tab
  const { loading: loadMyBusy, students: myStudents, reload: reloadMy } = useMyStudents(user?.id, tab==='add')

  // realtime bump
  useRealtimeSOS(user?.id, () => setRefreshTick(t => t + 1))

  const currentStatusColor = useMemo(() => {
    const st = objectives[objectives.length-1]?.status
    return st === 'done' ? '#22c55e' : st === 'pending' ? '#f59e0b' : st === 'blocked' ? '#ef4444' : '#64748b'
  }, [objectives])

  const onUpdateStatus = async (rowId, newValue) => {
    const { error } = await supabase.from('student_objectives_status').update({ achieved:newValue }).eq('id', rowId)
    if (!error) setObjectives(prev => prev.map(o => o.statusRowId===rowId ? { ...o, status:newValue } : o))
  }

  const onStudentAdded = useCallback(async (studentId, firstSubjectId) => {
    setTab('dashboard')
    if (firstSubjectId) setSelSubject(firstSubjectId)
    await reloadMy()
    setRefreshTick(t => t + 1)
  }, [reloadMy])

  return (
    <div className="teacher-hero">
      <TeacherHeader profile={profile} onSignOut={signOut} />
      <Tabs tab={tab} setTab={setTab} />

      {tab === 'add' && (
        <AddStudentForm
          teacher={user}
          profile={profile}
          allSubjects={allSubjects}
          initialSelectedSubjects={mySubjectIds}
          onSubjectsChange={setMySubjectIds}
          onStudentAdded={onStudentAdded}
          myStudents={myStudents}
          loadMyBusy={loadMyBusy}
        />
      )}

      {tab === 'dashboard' && (
        <div className="dashboard-area">
          <SubjectCards
            loading={loading}
            subjects={subjects}
            selSubject={selSubject}
            setSelSubject={setSelSubject}
            setSelStudent={setSelStudent}
          />
          {!!selSubject && (
            <StudentsList
              subjectName={subjects.find(s=>s.id===selSubject)?.name}
              students={students}
              selStudent={selStudent}
              setSelStudent={setSelStudent}
            />
          )}
          {!!selStudent && (
            <StatusBoard
              objectives={objectives}
              onUpdate={onUpdateStatus}
              saving={false}
              currentStatusColor={currentStatusColor}
              studentName={students.find(s=>s.id===selStudent)?.full_name}
              subjectName={subjects.find(s=>s.id===selSubject)?.name}
            />
          )}

          {/* لوحة تعديل الطالب (نفس منطقك السابق) */}
          {!!selStudent && (
            <EditStudentPanel
              teacherId={user?.id}
              selStudent={selStudent}
              allSubjects={subjects}
              onChanged={() => setRefreshTick(t=>t+1)}
            />
          )}
          {!!selStudent && (
  
    <ExportStudentReport
      teacherId={user?.id}
      teacherProfile={profile}
      studentId={selStudent}
      studentName={ (students.find(s=>s.id===selStudent)?.full_name) || '' }
      subjects={subjects}
    />
)}

          
        </div>
      )}
    </div>
  )
}
