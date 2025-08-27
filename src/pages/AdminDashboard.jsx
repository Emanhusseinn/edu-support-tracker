import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import '../styles/admin.scss'
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('teachers')

  // lists
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [objectives, setObjectives] = useState([])         
  const [selSubject, setSelSubject] = useState(null)
  const [studentTeacher, setStudentTeacher] = useState('');
  

  // inputs
  const [newSubject, setNewSubject] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentGrade, setStudentGrade] = useState('')
  const [objTitle, setObjTitle] = useState('')
  const [objDesc, setObjDesc] = useState('')
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // assign
  const [assignStudent, setAssignStudent] = useState('')
  const [assignObjective, setAssignObjective] = useState('')
  const [assignBusy, setAssignBusy] = useState(false)
const [assignTeacher, setAssignTeacher] = useState('');
// view drilldown
const [selTeacher, setSelTeacher] = useState('');
const [tStudents, setTStudents] = useState([]);
const [selStudent, setSelStudent] = useState('');
const [tSubjects, setTSubjects] = useState([]);
const [selSubj, setSelSubj] = useState('');
const [assignRows, setAssignRows] = useState([]);
const [availObjectives, setAvailObjectives] = useState([]);
const [newObjective, setNewObjective] = useState('');
const [notes, setNotes] = useState('');
const [busyAssignTab, setBusyAssignTab] = useState(false);
const [errAssignTab, setErrAssignTab] = useState('');
const [filterGrade, setFilterGrade] = useState('');   // لفلترة الأهداف المعروضة
const [newObjGrade, setNewObjGrade] = useState('');   // الصف عند إضافة هدف جديد

const [confirm, setConfirm] = useState({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  danger: false,
  working: false,
  onConfirm: null,
});

function openConfirm(opts) {
  setConfirm(prev => ({ ...prev, open: true, working: false, ...opts }));
}
function closeConfirm() {
  setConfirm(prev => ({ ...prev, open: false, working: false, onConfirm: null }));
}
async function runConfirm() {
  if (!confirm.onConfirm) return;
  try {
    setConfirm(prev => ({ ...prev, working: true }));
    await confirm.onConfirm();
    closeConfirm();
  } catch (e) {
    setConfirm(prev => ({ ...prev, working: false }));
  }
}

const GRADES = Array.from({ length: 12 }, (_, i) => String(i + 1));
useEffect(() => {
  if (!selTeacher) { setTStudents([]); return; }
  (async () => {
    try {
      setBusyAssignTab(true); setErrAssignTab('');
      const { data: sos, error } = await supabase
        .from('student_objectives_status')
        .select('student_id')
        .eq('teacher_id', selTeacher);
      if (error) throw error;

      const ids = [...new Set((sos||[]).map(r=>r.student_id))];
      if (ids.length === 0) { setTStudents([]); return; }
      const { data: studs, error: e2 } = await supabase
        .from('students')
        .select('id, full_name')
        .in('id', ids)
        .order('full_name', { ascending: true });
      if (e2) throw e2;
      setTStudents(studs || []);
    } catch (e) {
      setErrAssignTab(e.message);
      setTStudents([]);
    } finally { setBusyAssignTab(false); }
  })();
}, [selTeacher]);

useEffect(() => {
  if (!selTeacher || !selStudent) { setTSubjects([]); return; }
  (async () => {
    try {
      setBusyAssignTab(true); setErrAssignTab('');
      const { data: sos, error } = await supabase
        .from('student_objectives_status')
        .select('objective_id')
        .eq('teacher_id', selTeacher)
        .eq('student_id', selStudent);
      if (error) throw error;
      const objIds = [...new Set((sos||[]).map(r=>r.objective_id))];
      if (objIds.length === 0) { setTSubjects([]); return; }

      const { data: objs, error: e2 } = await supabase
        .from('objectives')
        .select('id, subject_id')
        .in('id', objIds);
      if (e2) throw e2;
      const subjIds = [...new Set(objs.map(o=>o.subject_id))];
      if (subjIds.length === 0) { setTSubjects([]); return; }

      const { data: subs, error: e3 } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', subjIds)
        .order('name', { ascending: true });
      if (e3) throw e3;
      setTSubjects(subs || []);
    } catch (e) {
      setErrAssignTab(e.message);
      setTSubjects([]);
    } finally { setBusyAssignTab(false); }
  })();
}, [selTeacher, selStudent]);

useEffect(() => {
  if (!selTeacher || !selStudent || !selSubj) { setAssignRows([]); setAvailObjectives([]); return; }
  refreshAssignments();
}, [selTeacher, selStudent, selSubj]);

async function refreshAssignments() {
  try {
    setBusyAssignTab(true); setErrAssignTab('');
    const { data: sos, error } = await supabase
      .from('student_objectives_status')
      .select('objective_id, achieved, notes')
      .eq('teacher_id', selTeacher)
      .eq('student_id', selStudent);
    if (error) throw error;

    const objIds = (sos||[]).map(r=>r.objective_id);
    const { data: subjectObjs, error: e2 } = await supabase
      .from('objectives')
      .select('id, title, description')
      .eq('subject_id', selSubj)
      .order('created_at', { ascending: false });
    if (e2) throw e2;

    const assignedMap = new Map(sos.map(r => [r.objective_id, r]));
    const rows = subjectObjs
      .filter(o => assignedMap.has(o.id))
      .map(o => ({
        objective_id: o.id,
        objective: o,
        achieved: assignedMap.get(o.id)?.achieved || 'pending',
        notes: assignedMap.get(o.id)?.notes || ''
      }));
    setAssignRows(rows);

    const available = subjectObjs.filter(o => !assignedMap.has(o.id));
    setAvailObjectives(available);
    setNewObjective('');
  } catch (e) {
    setErrAssignTab(e.message);
    setAssignRows([]); setAvailObjectives([]);
  } finally {
    setBusyAssignTab(false);
  }
}

async function addAssignment() {
  if (!selTeacher || !selStudent || !newObjective) return;
  try {
    setBusyAssignTab(true); setErrAssignTab('');
    const { error } = await supabase
      .from('student_objectives_status')
      .upsert({
        teacher_id: selTeacher,
        student_id: selStudent,
        objective_id: newObjective,
        achieved: 'pending',
        notes: notes || ''
      }, { onConflict: 'student_id,objective_id,teacher_id' });
    if (error) throw error;
    setNotes('');
    await refreshAssignments();
  } catch (e) {
    setErrAssignTab(e.message);
  } finally {
    setBusyAssignTab(false);
  }
}

async function updateStatus(objectiveId, newStatus) {
  try {
    const { error } = await supabase
      .from('student_objectives_status')
      .update({ achieved: newStatus })
      .eq('teacher_id', selTeacher)
      .eq('student_id', selStudent)
      .eq('objective_id', objectiveId);
    if (error) throw error;
    setAssignRows(rows => rows.map(r => r.objective_id===objectiveId ? {...r, achieved:newStatus} : r));
  } catch (e) {
    alert(e.message);
  }
}

let notesTimer;
function updateNotesDebounced(objectiveId, val) {
  setAssignRows(rows => rows.map(r => r.objective_id===objectiveId ? {...r, notes:val} : r));
  clearTimeout(notesTimer);
  notesTimer = setTimeout(async () => {
    try {
      const { error } = await supabase
        .from('student_objectives_status')
        .update({ notes: val })
        .eq('teacher_id', selTeacher)
        .eq('student_id', selStudent)
        .eq('objective_id', objectiveId);
      if (error) throw error;
    } catch (e) {
      console.error(e);
    }
  }, 500);
}

async function removeAssignment(objectiveId) {
  const { error } = await supabase
    .from('student_objectives_status')
    .delete()
    .eq('teacher_id', selTeacher)
    .eq('student_id', selStudent)
    .eq('objective_id', objectiveId);

  if (error) return alert(error.message);

  setAssignRows(rows => rows.filter(r => r.objective_id !== objectiveId));

  const { data: o } = await supabase
    .from('objectives')
    .select('id, title')
    .eq('id', objectiveId)
    .single();

  if (o) setAvailObjectives(prev => [{ id: o.id, title: o.title }, ...prev]);
}


  useEffect(() => {
    (async () => {
      await Promise.all([loadTeachers(), loadSubjects(), loadStudents()])
    })()
  }, [])

  useEffect(() => {
    if (!selSubject && subjects.length) setSelSubject(subjects[0].id)
  }, [subjects, selSubject])

useEffect(() => {
  if (selSubject) loadObjectives(selSubject);
}, [selSubject, filterGrade]);


async function loadTeachers() {
  try {
    setLoading(true);
    setErrorMsg('');

    const { data: teachersData, error: e1 } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });

    if (e1) throw e1;

    const { data: sos, error: e2 } = await supabase
      .from('student_objectives_status')
      .select('teacher_id, student_id');

    if (e2) throw e2;

    const counts = new Map(); // teacher_id -> Set(student_id)
    for (const row of sos || []) {
      if (!row.teacher_id) continue;
      if (!counts.has(row.teacher_id)) counts.set(row.teacher_id, new Set());
      counts.get(row.teacher_id).add(row.student_id);
    }

    const withCounts = (teachersData || []).map(t => ({
      ...t,
      student_count: counts.get(t.id)?.size || 0
    }));

    setTeachers(withCounts);
  } catch (e) {
    setErrorMsg(e.message);
    setTeachers([]);
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    if (tab === 'teachers') loadTeachers();
  }, [tab]);

  async function loadSubjects() {
    const { data, error } = await supabase.from('subjects').select('*').order('name')
    if (!error) setSubjects(data || [])
  }

// students
async function loadStudents() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, full_name, grade, teacher_id,
      teacher:profiles!students_teacher_id_fkey (id, full_name)
    `)
    .order('full_name', { ascending: true })

  if (error) {
    console.error(error)
    setStudents([])
    return
  }
  setStudents(data || [])
}


// objectives
async function loadObjectives(subjectId) {
  let query = supabase
    .from('objectives')
    .select('id, title, description, subject_id, grade, created_at')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  if (filterGrade) {
    query = query.eq('grade', parseInt(filterGrade, 10));
  }

  const { data, error } = await query;
  if (!error) setObjectives(data || []);
}



  // CRUD
  async function addSubject() {
    if (!newSubject.trim()) return
    const { error } = await supabase.from('subjects').insert({ name: newSubject.trim() })
    if (error) return alert(error.message)
    setNewSubject('')
    loadSubjects()
  }
async function delSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) return alert(error.message);
  loadSubjects();
}


async function addStudent() {
  if (!studentName.trim()) return;

  const payload = {
    full_name: studentName.trim(),
    grade: studentGrade || null,
    teacher_id: studentTeacher || null,
  };

  const { error } = await supabase.from('students').insert(payload);
  if (error) return alert(error.message);

  setStudentName('');
  setStudentGrade('');
  setStudentTeacher(''); 
  loadStudents();
}

async function delStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) return alert(error.message);
  loadStudents();
}


async function addObjective() {
  if (!selSubject || !objTitle.trim()) return;

  const gradeToSave = newObjGrade || filterGrade || null;

  const { error } = await supabase.from('objectives').insert({
    subject_id: selSubject,
    title: objTitle.trim(),
    description: objDesc || null,
    grade: gradeToSave,      
  });

  if (error) return alert(error.message);

  setObjTitle('');
  setObjDesc('');
  setNewObjGrade('');
  loadObjectives(selSubject);
}


async function delObjective(id) {
  const { error } = await supabase.from('objectives').delete().eq('id', id);
  if (error) return alert(error.message);
  loadObjectives(selSubject);
}

async function assign() {
  if (!assignTeacher) return alert('اختاري المعلم');
  if (!assignStudent) return alert('اختاري الطالب');
  if (!selSubject)   return alert('اختاري المادة');
  if (!assignObjective) return alert('اختاري الهدف');

  setAssignBusy(true);
  try {
    const payload = {
      teacher_id: assignTeacher,
      student_id: assignStudent,
      objective_id: assignObjective,
      achieved: 'pending',
      notes: ''    
    };

    const { error } = await supabase
      .from('student_objectives_status')
      .upsert(payload, { onConflict: 'student_id,objective_id,teacher_id' });

    if (error) throw error;

    setAssignObjective('');
  } catch (e) {
    alert(e.message);
  } finally {
    setAssignBusy(false);
  }
}


  const teachersCount = teachers.length
  const subjectsCount = subjects.length
  const studentsCount = students.length
  const objectivesCount = objectives.length

  return (
    <div className="admin-hero">
      <div className="admin-card">
        <div className="admin-header">
          <h2>Admin Dashboard</h2>
          <div className="tools">
            <button onClick={() => signOut()}>Logout</button>
          </div>
        </div>

        <div className="tabs">
          <button className={tab==='teachers'?'active':''} onClick={()=>setTab('teachers')}>Teachers ({teachersCount})</button>
          <button className={tab==='subjects'?'active':''} onClick={()=>setTab('subjects')}>Subjects ({subjectsCount})</button>
          <button className={tab==='students'?'active':''} onClick={()=>setTab('students')}>Students ({studentsCount})</button>
          <button className={tab==='objectives'?'active':''} onClick={()=>setTab('objectives')}>Objectives ({objectivesCount})</button>
          <button className={tab==='assign'?'active':''} onClick={()=>setTab('assign')}>Assign</button>
          <button className={tab==='view'?'active':''} onClick={()=>setTab('view')}>Lists</button>
        </div>

        {tab === 'teachers' && (
<section className="panel">
  <h3 className="table-title">Registered Teachers</h3>
  <div className="table-container">
<table className="styled-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>ID</th>
      <th>Students</th> 
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    {teachers.length === 0 ? (
      <tr><td colSpan={4} style={{textAlign:'center',opacity:.7}}>No teachers yet.</td></tr>
    ) : teachers.map(t => (
      <tr key={t.id}>
        <td>{t.full_name || '—'}</td>
        <td><code>{t.id}</code></td>
        <td>
          <span className="pill pill-count">{t.student_count ?? 0}</span>
        </td>
        <td><span className={`role-badge ${t.role}`}>{t.role}</span></td>
      </tr>
    ))}
  </tbody>
</table>

  </div>
</section>

        )}

{tab === 'subjects' && (
  <section className="panel">
    <div className="panel-header">
      <div className="title">
        <span>Subjects</span>
        <span className="muted">({subjects.length})</span>
      </div>

      <div className="tools">
        <input
          placeholder="New subject (e.g., Arabic)"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
        />
       <button
  onClick={() => {
    if (!newSubject.trim()) return;
    openConfirm({
      title: 'Add subject',
      message: `Add subject "${newSubject}"؟`,
      confirmLabel: 'Add',
      danger: false,
      onConfirm: async () => { await addSubject(); },
    });
  }}
>
  Add
</button>

        <button className="ghost" onClick={loadSubjects}>Refresh</button>
      </div>
    </div>

    <table className="styled-table">
      <thead>
        <tr>
          <th style={{textAlign:'left'}}>Name</th>
          <th style={{width:120, textAlign:'right'}}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {subjects.length === 0 ? (
          <tr>
            <td colSpan={2} style={{textAlign:'center', opacity:.7}}>
              No subjects.
            </td>
          </tr>
        ) : subjects.map(s => (
          <tr key={s.id}>
            <td style={{textAlign:'left'}}>{s.name}</td>
            <td style={{textAlign:'right'}}>
            <button
  className="danger"
  onClick={() =>
    openConfirm({
      title: 'Delete subject',
      message: 'Are you sure you want to delete this subject?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => { await delSubject(s.id); },
    })
  }
>
  Delete
</button>

            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)}


{tab === 'students' && (
  <section className="panel">
    <div className="panel-header">
      <div className="title">
        <span>Students</span>
        <span className="muted">({students.length})</span>
      </div>

      <div className="tools">
        <input
          placeholder="Full name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <input
          placeholder="Grade (optional)"
          value={studentGrade}
          onChange={(e) => setStudentGrade(e.target.value)}
        />
<select value={studentTeacher || ''} onChange={e => setStudentTeacher(e.target.value)}>
  <option value="">— No teacher —</option>
  {teachers.map(t => (
    <option key={t.id} value={t.id}>{t.full_name}</option>
  ))}
</select>

       <button
  onClick={() => {
    if (!studentName.trim()) return;
    openConfirm({
      title: 'Add student',
      message: `Add student "${studentName}"؟`,
      confirmLabel: 'Add',
      onConfirm: async () => { await addStudent(); },
    });
  }}
>
  Add
</button>

        <button className="ghost" onClick={loadStudents}>Refresh</button>
      </div>
    </div>

    <table className="styled-table">
      <thead>
        <tr>
          <th style={{textAlign:'left'}}>Name</th>
          <th>Grade</th>
          <th>Teacher</th>
          <th style={{width:120, textAlign:'right'}}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {students.length === 0 ? (
          <tr>
            <td colSpan={4} style={{textAlign:'center', opacity:.7}}>
              No students.
            </td>
          </tr>
        ) : students.map(s => (
          <tr key={s.id}>
            <td style={{textAlign:'left'}}>{s.full_name}</td>
            <td>{s.grade || '—'}</td>
            <td>
              {(() => {
                const t = teachers.find(x => x.id === s.teacher_id)
                return t ? (t.full_name || '—') : '—'
              })()}
            </td>
            <td style={{textAlign:'right'}}>
              <button
  className="danger"
  onClick={() =>
    openConfirm({
      title: 'Delete student',
      message: 'Are you sure you want to delete this student?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => { await delStudent(s.id); },
    })
  }
>
  Delete
</button>

            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)}


{tab === 'objectives' && (
  <section className="panel">
    <div className="panel-header">
      <div className="title">
        <span>Objectives</span>
        <span className="muted">({objectives.length})</span>
      </div>

<div className="tools">
  <select value={selSubject || ''} onChange={(e) => setSelSubject(e.target.value)}>
    {subjects.map(s => (
      <option key={s.id} value={s.id}>{s.name}</option>
    ))}
  </select>

  <select
    value={filterGrade}
    onChange={(e) => {
      setFilterGrade(e.target.value);
      setNewObjGrade('');
    }}
  >
    <option value="">كل الصفوف</option>
    {GRADES.map(g => (
      <option key={g} value={g}>الصف {g}</option>
    ))}
  </select>

  <input
    placeholder="Objective title"
    value={objTitle}
    onChange={(e) => setObjTitle(e.target.value)}
  />
  <input
    placeholder="Description (optional)"
    value={objDesc}
    onChange={(e) => setObjDesc(e.target.value)}
  />

  {!filterGrade && (
    <select value={newObjGrade} onChange={(e) => setNewObjGrade(e.target.value)}>
      <option value="">بدون صف</option>
      {GRADES.map(g => (
        <option key={g} value={g}>الصف {g}</option>
      ))}
    </select>
  )}

  <button
  onClick={() => {
    if (!selSubject || !objTitle.trim()) return;
    openConfirm({
      title: 'Add objective',
      message: `Add objective "${objTitle}"؟`,
      confirmLabel: 'Add',
      onConfirm: async () => { await addObjective(); },
    });
  }}
>
  Add
</button>

  <button className="ghost" onClick={() => loadObjectives(selSubject)}>Refresh</button>
</div>


    </div>

    <table className="styled-table">
      <thead>
        <tr>
          <th style={{textAlign:'left'}}>Title</th>
          <th>Grade</th>
          <th>Description</th>
          <th style={{width:120, textAlign:'right'}}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {objectives.length === 0 ? (
          <tr>
            <td colSpan={3} style={{textAlign:'center', opacity:.7}}>
              لا توجد أهداف لهذه المادة.
            </td>
          </tr>
        ) : objectives.map(o => (
          <tr key={o.id}>
            <td style={{textAlign:'left', display:'flex', alignItems:'center', gap:10}}>
              <span style={{
                width:8,height:8,borderRadius:999,background:'#8b5cf6',
                boxShadow:'0 0 0 3px rgba(139,92,246,.15)',flex:'0 0 8px'
              }} />
              <span title={o.title} style={{fontWeight:600}}>{o.title}</span>
            </td>
             <td>{o.grade ?? '—'}</td> 
            <td>{o.description || '—'}</td>
            <td style={{textAlign:'right'}}>
              <button
  className="danger"
  onClick={() =>
    openConfirm({
      title: 'Delete objective',
      message: 'Are you sure you want to delete this objective?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => { await delObjective(o.id); },
    })
  }
>
  Delete
</button>

            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)}


{tab === 'view' && (
  <section className="panel">
    <div className="panel-header">
      <div className="title">
        <span>Lists</span>
        <span className="muted">استعراض الأهداف المسندة وتحديث حالتها</span>
      </div>

      <div className="tools lists-tools">
        {/* Teacher */}
        <select
          value={selTeacher}
          onChange={e => {
            setSelTeacher(e.target.value);
            setSelStudent('');
            setSelSubj('');
            setAssignRows([]);
          }}
        >
          <option value="">اختاري معلماً</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.full_name || t.id}</option>
          ))}
        </select>

        <select
          value={selStudent}
          onChange={e => { setSelStudent(e.target.value); setSelSubj(''); setAssignRows([]); }}
          disabled={!selTeacher || tStudents.length===0}
        >
          <option value="">اختاري طالباً</option>
          {tStudents.map(s => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>

        <select
          value={selSubj}
          onChange={e => setSelSubj(e.target.value)}
          disabled={!selTeacher || !selStudent || tSubjects.length===0}
        >
          <option value="">اختاري مادة</option>
          {tSubjects.map(su => (
            <option key={su.id} value={su.id}>{su.name}</option>
          ))}
        </select>

        <button className="ghost" onClick={refreshAssignments}>Refresh</button>
      </div>
    </div>

    {busyAssignTab && <div style={{paddingTop:8}}>Loading…</div>}
    {errAssignTab && <div style={{paddingTop:8, color:'#f88'}}>Error: {errAssignTab}</div>}

    {(selTeacher && selStudent && selSubj) && (
 <div className="table-wrap">
  <table className="styled-table lists-table">
    <thead>
      <tr>
        <th style={{textAlign:'left'}}>Objective</th>
        <th>Status</th>
        <th style={{textAlign:'left'}}>Notes</th>
        <th style={{textAlign:'center'}}>Actions</th>
      </tr>
    </thead>

    <tbody>
      {assignRows.length === 0 ? (
        <tr>
          <td colSpan={4} style={{textAlign:'center', opacity:.7}}>
            لا توجد أهداف مُسنّدة لهذه المادة.
          </td>
        </tr>
      ) : assignRows.map(row => (
        <tr key={row.objective_id}>
          <td style={{textAlign:'left'}}>
            <div className="cell-main">
              <span className="dot" />
              <span className="text">{row.objective?.title}</span>
            </div>
          </td>

          <td>
            <select
              value={row.achieved || 'pending'}
              onChange={e => updateStatus(row.objective_id, e.target.value)}
            >
              <option value="pending">pending</option>
              <option value="done">done</option>
              <option value="na">na</option>
            </select>
          </td>

          <td style={{textAlign:'left'}}>
            <input
              value={row.notes || ''}
              onChange={e => updateNotesDebounced(row.objective_id, e.target.value)}
              placeholder="notes…"
            />
          </td>

          <td style={{textAlign:'center'}}>
<button
  className="danger"
  onClick={() =>
    openConfirm({
      title: 'Delete assignment',
      message: 'Remove this objective from the student?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => { await removeAssignment(row.objective_id); },
    })
  }
>
  Delete
</button>

          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

    )}
  </section>
)}



{tab === 'assign' && (
  <section className="panel">
    <div className="panel-header">
      <div className="title">
        <span>Assign</span>
        <span className="muted">اسندي هدفًا لطالب مع معلّم</span>
      </div>

      <div className="tools assign-tools">
        {/* Teacher */}
        <select value={assignTeacher} onChange={e=>setAssignTeacher(e.target.value)}>
          <option value="">Select teacher</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.full_name || '—'}</option>
          ))}
        </select>

        {/* Student */}
        <select value={assignStudent} onChange={e=>setAssignStudent(e.target.value)}>
          <option value="">Select student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>

        {/* Subject */}
        <select value={selSubject || ''} onChange={e=>setSelSubject(e.target.value)}>
          {subjects.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

        {/* Objective */}
        <select value={assignObjective} onChange={e=>setAssignObjective(e.target.value)}>
          <option value="">Objective</option>
          {objectives.map(o => (<option key={o.id} value={o.id}>{o.title}</option>))}
        </select>

<button
  disabled={assignBusy}
  onClick={() => {
    if (!assignTeacher || !assignStudent || !selSubject || !assignObjective) return;
    openConfirm({
      title: 'Assign objective',
      message: `Assign selected objective to the student?`,
      confirmLabel: 'Assign',
      onConfirm: async () => { await assign(); },
    });
  }}
>
  {assignBusy ? 'Working…' : 'Assign'}
</button>

      </div>
    </div>

    <p className="section-title" style={{opacity:.8, marginTop:0}}>
      اختاري المعلّم ثم الطالب والمادة والهدف واضغطي <b>Assign</b>.
    </p>
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
