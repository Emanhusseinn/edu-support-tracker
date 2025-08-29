// src/hooks/useStudentsBySubject.js
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function useStudentsBySubject(teacherId, subjectId, deps=[]) {
  const [students, setStudents] = useState([])
  useEffect(() => {
    if (!teacherId || !subjectId) { setStudents([]); return }
    let alive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('student_objectives_status')
        .select(`student:students!inner(id,full_name,grade), objective:objectives!inner(id,subject_id)`)
        .eq('teacher_id', teacherId).eq('objective.subject_id', subjectId)
      if (!alive) return
      if (error) return setStudents([])
      const uniq = new Map()
      for (const r of data || []) if (r.student) uniq.set(r.student.id, r.student)
      setStudents([...uniq.values()].sort((a,b)=>a.full_name.localeCompare(b.full_name,'ar')))
    })()
    return () => { alive = false }
  }, [teacherId, subjectId, ...deps])
  return students
}
