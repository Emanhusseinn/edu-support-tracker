// src/hooks/useMyStudents.js
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function useMyStudents(teacherId, active) {
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState([])
  const load = useCallback(async () => {
    if (!teacherId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('students').select('id,full_name,grade,disability,plan_type')
      .eq('teacher_id', teacherId).order('full_name', { ascending: true })
    if (!error) setStudents(data || [])
    setLoading(false)
  }, [teacherId])
  useEffect(() => { if (active) load() }, [active, load])
  return { loading, students, reload: load, setStudents }
}
