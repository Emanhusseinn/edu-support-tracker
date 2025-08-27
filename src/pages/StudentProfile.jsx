import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function StudentProfile(){
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [objectivesStatus, setObjectivesStatus] = useState([]) // joined info
  const [allObjectives, setAllObjectives] = useState([])

  useEffect(()=>{ fetch() },[id])

  async function fetch(){
    const { data: s } = await supabase.from('students').select('*').eq('id', id).single()
    setStudent(s || null)

    const { data: allObj } = await supabase.from('objectives').select('id,description,subject_id')
    setAllObjectives(allObj || [])

    const { data: statuses } = await supabase
      .from('student_objectives_status')
      .select('*')
      .eq('student_id', id)
    const map = {}
    (statuses || []).forEach(st => map[st.objective_id] = st)
    const list = (allObj || []).map(o => ({
      objective: o,
      statusRow: map[o.id] || null
    }))
    setObjectivesStatus(list)
  }

  async function changeStatus(objectiveId, newStatus){
    const existing = objectivesStatus.find(x=>x.objective.id===objectiveId)?.statusRow
    if (existing) {
      const { error } = await supabase
        .from('student_objectives_status')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', existing.id)
      if (error) return alert(error.message)
    } else {
      const { error } = await supabase
        .from('student_objectives_status')
        .insert([{ student_id: id, objective_id: objectiveId, status: newStatus }])
      if (error) return alert(error.message)
    }
    await fetch()
  }

  if (!student) return <div>Loading...</div>

  return (
    <div style={{padding:20}}>
      <h2>Student: {student.name}</h2>
      <h3>Objectives</h3>
      <table border="1" cellPadding="6">
        <thead><tr><th>Objective</th><th>Status</th><th>actions</th></tr></thead>
        <tbody>
          {objectivesStatus.map(item => (
            <tr key={item.objective.id}>
              <td>{item.objective.description}</td>
              <td>{item.statusRow ? item.statusRow.status : 'not_started'}</td>
              <td>
                <button onClick={()=>changeStatus(item.objective.id, 'not_started')}>Not started</button>
                <button onClick={()=>changeStatus(item.objective.id, 'in_progress')}>In progress</button>
                <button onClick={()=>changeStatus(item.objective.id, 'achieved')}>Achieved</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
