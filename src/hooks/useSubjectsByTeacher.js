// src/hooks/useSubjectsByTeacher.js
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function useSubjectsByTeacher(teacherId, deps=[]) {
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('student_objectives_status')
        .select(`objective:objectives!inner(id,subject_id,subject:subjects!inner(id,name))`)
        .eq('teacher_id', teacherId)
      if (!alive) return
      if (error) { setSubjects([]); setLoading(false); return }
      const uniq = new Map()
      for (const r of data || []) if (r.objective?.subject) uniq.set(r.objective.subject.id, r.objective.subject)
      setSubjects([...uniq.values()].sort((a,b)=>a.name.localeCompare(b.name,'ar')))
      setLoading(false)
    })()
    return () => { alive = false }
  }, [teacherId, ...deps])

  return { loading, subjects }
}
