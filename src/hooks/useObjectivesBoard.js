// src/hooks/useObjectivesBoard.js
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function useObjectivesBoard(teacherId, subjectId, studentId, deps=[]) {
  const [rows, setRows] = useState([]) // [{id,title,description,statusRowId,status}]
  useEffect(() => {
    if (!teacherId || !subjectId || !studentId) { setRows([]); return }
    let alive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('student_objectives_status')
        .select(`id,achieved,objective:objectives!inner(id,title,description,subject_id)`)
        .eq('teacher_id', teacherId).eq('student_id', studentId).eq('objective.subject_id', subjectId)
        .order('created_at', { ascending: true })
      if (!alive) return
      if (error) return setRows([])
      setRows((data || []).map(r => ({
        id: r.objective.id, title: r.objective.title, description: r.objective.description,
        statusRowId: r.id, status: r.achieved || 'pending'
      })))
    })()
    return () => { alive = false }
  }, [teacherId, subjectId, studentId, ...deps])
  return [rows, setRows]
}
