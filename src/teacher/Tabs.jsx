// src/teacher/Tabs.jsx
export default function Tabs({ tab, setTab }) {
  return (
    <div className="teacher-tabs">
      <button className={tab==='add'?'active add-stu-btn':'add-stu-btn'} onClick={()=>setTab('add')}>اضافة طالب</button>
      <button className={tab==='dashboard'?'active add-stu-btn':'add-stu-btn'} onClick={()=>setTab('dashboard')}>جميع الطلاب</button>
    </div>
  )
}
