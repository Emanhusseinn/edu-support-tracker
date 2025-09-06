// src/constants/school.js
export const DISABILITIES = [
  { value:'hearing', label:'الإعاقة السمعية' },
  { value:'visual', label:'الإعاقة البصرية' },
  { value:'intellectual', label:'الإعاقة الذهنية' },
  { value:'physical', label:'الإعاقة الجسدية' },
  { value:'autism', label:'اضطرابات طيف التوحد' },
  { value:'psychological', label:'الاضطرابات النفسية' },
  { value:'communication', label:'اضطرابات التواصل' },
  { value:'learning', label:'صعوبات التعلم المحددة' },
  { value:'adhd', label:'اضطرابات قصور الانتباه والنشاط الزائد' },
  { value:'multiple', label:'الإعاقة المتعددة' },
  { value:'hearing_visual', label:'الإعاقة السمعية البصرية' },
  { value:'health', label:'الأمراض والظروف الصحية' },
  { value:'unspecified', label:'غير مصنف' },
  { value:'other', label:'أخرى' },
]

export const PLAN_TYPES = [
  { value:'accommodation', label:'خطة فردية تكيف' },
  { value:'modification', label:'خطة فردية تعديل' },
  { value:'remedial', label:'خطة علاجية' },
  { value:'gifted', label:'خطة اثرائية' },
  { value:'support', label:'خطة دعم' },
  { value:'rehab', label:'خطة تأهيلية' },
  { value:'other', label:'أخرى' },
]

// KG1=0, KG2=-1 ثم 1..12
export const GRADES_FULL = [
  { v:0, t:'KG1' },
  { v:-1, t:'KG2' },
  ...Array.from({length:12}, (_,i)=>({v:i+1, t:`${i+1}`})),
]
