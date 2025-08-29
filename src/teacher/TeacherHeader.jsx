// src/teacher/TeacherHeader.jsx
import { FaRegUserCircle } from 'react-icons/fa'
export default function TeacherHeader({ profile, onSignOut }) {
  return (
    <header className="teacher-top">
      <div className="who">
        <div className="name">
          <span><FaRegUserCircle /></span>
          <p>{profile?.full_name || 'معلّم'}</p>
          <p>{profile?.school_name ? ` — ${profile.school_name}` : ''}</p>
        </div>
      </div>
      <button className="logout" onClick={onSignOut}>تسجيل الخروج</button>
    </header>
  )
}
