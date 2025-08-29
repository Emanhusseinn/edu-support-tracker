// src/constants/school.js
export const DISABILITIES = [
  { value:'none', label:'بدون' }, { value:'visual', label:'بصرية' }, { value:'hearing', label:'سمعية' },
  { value:'intellectual', label:'ذهنية' }, { value:'autism', label:'طيف التوحد' }, { value:'learning', label:'صعوبات تعلم' },
  { value:'speech', label:'نطق/لغة' }, { value:'adhd', label:'فرط حركة/نقص انتباه' }, { value:'physical', label:'حركية' },
  { value:'multiple', label:'متعددة' }, { value:'other', label:'أخرى' },
]

export const PLAN_TYPES = [
  { value:'iep', label:'خطة فردية (IEP)' }, { value:'behavior', label:'خطة سلوكية' },
  { value:'remedial', label:'خطة علاجية/تقوية' }, { value:'support', label:'خطة دعم' },
  { value:'gifted', label:'خطة للموهوبين' }, { value:'rehab', label:'تأهيلية' }, { value:'other', label:'أخرى' },
]

// KG1=0, KG2=-1 ثم 1..12
export const GRADES_FULL = [{ v:0, t:'KG1' }, { v:-1, t:'KG2' }, ...Array.from({length:12}, (_,i)=>({v:i+1, t:`${i+1}`}))]
