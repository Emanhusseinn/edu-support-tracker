// src/teacher/ExportStudentReport.jsx
import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import { DISABILITIES, PLAN_TYPES } from '../constants/school'

/** ترجمة الحالة للعرض */
function statusLabel(v) {
  if (v === 'done') return 'منتهية'
  if (v === 'pending') return 'قيد الإنتظار'
  if (v === 'na') return 'لم تتم بعد'
  return v || '—'
}

/** تنزيل ملف Blob */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ExportStudentReport({
  teacherId,
  teacherProfile,        // { full_name, school_name }
  studentId,
  studentName,
  subjects,              // [{id, name}]
}) {
  const [busy, setBusy] = useState(false)

  async function fetchStudentBase() {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, disability, plan_type')
      .eq('id', studentId)
      .single()
    if (error) throw error
    return data
  }

  async function fetchAllData() {
    // جميع الأهداف مع وصف الهدف والملاحظات
    const { data, error } = await supabase
      .from('student_objectives_status')
      .select(`
        achieved,
        notes,
        objective:objectives!inner(id, title, description, subject_id)
      `)
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  function groupBySubject(rows) {
    const bySubj = new Map()
    const subjMap = new Map(subjects.map(s => [s.id, s.name]))
    for (const r of rows) {
      const sid = r.objective?.subject_id
      const list = bySubj.get(sid) || []
      list.push(r)
      bySubj.set(sid, list)
    }
    return { bySubj, subjMap }
  }

  async function exportWord() {
    try {
      setBusy(true)
      const [student, rows] = await Promise.all([fetchStudentBase(), fetchAllData()])
      const { bySubj, subjMap } = groupBySubject(rows)

      const teacherName = teacherProfile?.full_name || '—'
      const schoolName  = teacherProfile?.school_name || '—'
      const disabilityLabel = DISABILITIES.find(d => d.value === student?.disability)?.label || '—'
      const planLabel = PLAN_TYPES.find(p => p.value === student?.plan_type)?.label || '—'

      // HTML بسيط يفهمه Word
      let html = `
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: "Tahoma", Arial, sans-serif; color: #111; }
              .esr-report { max-width: 900px; margin: 0 auto; }
              .esr-head { margin-bottom: 16px; border-bottom: 2px solid #ddd; padding-bottom: 8px; }
              .esr-title { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
              .esr-meta { font-size: 14px; color: #333; line-height: 1.9; }
              .esr-subject { margin-top: 24px; font-size: 18px; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { border: 1px solid #ccc; padding: 8px; font-size: 13px; vertical-align: top; }
              th { background: #f3f4f6; }
              .esr-note { color: #555; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="esr-report">
              <div class="esr-head">
                <div class="esr-title">تقرير الطالب</div>
                <div class="esr-meta">
                  <div>اسم الطالب: <b>${student?.full_name || studentName || '—'}</b></div>
                  <div>الإعاقة: <b>${disabilityLabel}</b></div>
                  <div>نوع الخطة: <b>${planLabel}</b></div>
                  <div>اسم المعلم: <b>${teacherName}</b></div>
                  <div>اسم المدرسة: <b>${schoolName}</b></div>
                  <div>تاريخ التصدير: ${new Date().toLocaleString('ar')}</div>
                </div>
              </div>
      `

      for (const [sid, list] of bySubj.entries()) {
        const subjName = subjMap.get(sid) || '— مادة غير معروفة —'
        html += `
          <div class="esr-subject">المادة: ${subjName}</div>
          <table>
            <thead>
              <tr>
                <th style="width:38%">الهدف</th>
                <th style="width:30%">وصف</th>
                <th style="width:14%">الحالة</th>
                <th style="width:18%">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
        `
        for (const r of list) {
          html += `
            <tr>
              <td>${r.objective?.title || ''}</td>
              <td>${r.objective?.description || ''}</td>
              <td>${statusLabel(r.achieved)}</td>
              <td class="esr-note">${r.notes || ''}</td>
            </tr>
          `
        }
        html += `</tbody></table>`
      }

      if (bySubj.size === 0) {
        html += `<div>لا توجد أهداف مُسنّدة لهذا الطالب حالياً.</div>`
      }

      html += `</div></body></html>`

      const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
      const fname = `تقرير_${student?.full_name || studentName || 'طالب'}.doc`
      downloadBlob(blob, fname)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function exportExcel() {
    try {
      setBusy(true)
      const [student, rows] = await Promise.all([fetchStudentBase(), fetchAllData()])

      const teacherName = teacherProfile?.full_name || '—'
      const schoolName  = teacherProfile?.school_name || '—'
      const disabilityLabel = DISABILITIES.find(d => d.value === student?.disability)?.label || '—'
      const planLabel = PLAN_TYPES.find(p => p.value === student?.plan_type)?.label || '—'
      const subjMap = new Map(subjects.map(s => [s.id, s.name]))

      // صف العنوان/الميتا في ورقة منفصلة
      const metaSheetData = [
        ['تقرير الطالب'],
        ['اسم الطالب', student?.full_name || studentName || '—'],
        ['الإعاقة', disabilityLabel],
        ['نوع الخطة', planLabel],
        ['اسم المعلم', teacherName],
        ['اسم المدرسة', schoolName],
        ['تاريخ التصدير', new Date().toLocaleString('ar')],
      ]
      const metaWS = XLSX.utils.aoa_to_sheet(metaSheetData)

      // بيانات الأهداف صفاً صفاً
      const header = ['المادة', 'الهدف', 'الوصف', 'الحالة', 'ملاحظات']
      const dataRows = rows.map(r => ([
        subjMap.get(r.objective?.subject_id) || '',
        r.objective?.title || '',
        (r.objective?.description || '').replace(/\n/g, ' '),
        statusLabel(r.achieved),
        (r.notes || '').replace(/\n/g, ' ')
      ]))
      const dataWS = XLSX.utils.aoa_to_sheet([header, ...dataRows])

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, metaWS, 'بيانات عامة')
      XLSX.utils.book_append_sheet(wb, dataWS, 'الأهداف')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const fname = `تقرير_${student?.full_name || studentName || 'طالب'}.xlsx`
      downloadBlob(blob, fname)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="esr-export">
      <div className="esr-label">تصدير تقرير الطالب:</div>
      <div className="esr-actions">
        <button className="esr-btn" onClick={exportWord} disabled={busy}>
          {busy ? 'جارٍ التحضير…' : 'تصدير Word'}
        </button>
        <button className="esr-btn ghost" onClick={exportExcel} disabled={busy}>
          {busy ? 'جارٍ التحضير…' : 'تصدير Excel'}
        </button>
      </div>
    </div>
  )
}
