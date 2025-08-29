// src/hooks/useRealtimeSOS.js
import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function useRealtimeSOS(teacherId, onInsert) {
  useEffect(() => {
    if (!teacherId) return
    const ch = supabase
      .channel('sos-live')
      .on('postgres_changes',
        { event:'INSERT', schema:'public', table:'student_objectives_status', filter:`teacher_id=eq.${teacherId}` },
        onInsert
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [teacherId, onInsert])
}
