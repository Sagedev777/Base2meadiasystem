import { Grade, LetterGrade, GradeWord, GpaSummary, AttendanceRecord, AttendanceSummary, Student, Staff, Class, Term, Course, Payment, User } from '../types';

export function calcGrade(score: number): { letterGrade: LetterGrade; gradePoints: number; descriptiveWord: GradeWord } {
  if (score >= 90) return { letterGrade: 'A+', gradePoints: 4.0, descriptiveWord: 'Outstanding' };
  if (score >= 80) return { letterGrade: 'A',  gradePoints: 3.7, descriptiveWord: 'Excellent' };
  if (score >= 70) return { letterGrade: 'B',  gradePoints: 3.0, descriptiveWord: 'Good' };
  if (score >= 60) return { letterGrade: 'C',  gradePoints: 2.0, descriptiveWord: 'Average' };
  if (score >= 50) return { letterGrade: 'D',  gradePoints: 1.0, descriptiveWord: 'Poor' };
  if (score >= 30) return { letterGrade: 'F',  gradePoints: 0.0, descriptiveWord: 'Failed' };
  return              { letterGrade: 'F-', gradePoints: 0.0, descriptiveWord: 'Worst' };
}

export const DEMO_USERS: (User & { password: string })[] = [
  { id: 'u1', email: 'admin@base2media.ac',   password: 'admin123',   role: 'admin',   name: 'Dr. Samuel Osei' },
  { id: 'u2', email: 'staff@base2media.ac',   password: 'staff123',   role: 'staff',   name: 'Ms. Grace Mensah' },
  { id: 'u3', email: 'student@base2media.ac', password: 'student123', role: 'student', name: 'Kwame Asante' },
  { id: 'u4', email: 'parent@base2media.ac',  password: 'parent123',  role: 'parent',  name: 'Mr. Joseph Asante' },
];

export const TERMS: Term[] = [
  { id: 't1', name: 'Semester 1 – 2024', startDate: '2024-01-08', endDate: '2024-06-30', isCurrent: false },
  { id: 't2', name: 'Semester 2 – 2024', startDate: '2024-07-08', endDate: '2024-12-20', isCurrent: false },
  { id: 't3', name: 'Semester 1 – 2025', startDate: '2025-01-13', endDate: '2025-06-27', isCurrent: true  },
];

// ── 25 University Courses ─────────────────────────────────────────
export const COURSES: Course[] = [
  // Creative Media
  { id: 'c01', code: 'PHO101', name: 'Photography',              department: 'Creative Media', durationMonths: 6 },
  { id: 'c02', code: 'VID101', name: 'Video Production',         department: 'Creative Media', durationMonths: 6 },
  { id: 'c03', code: 'FLM101', name: 'Filming & Production',     department: 'Creative Media', durationMonths: 9 },
  { id: 'c04', code: 'CRA101', name: 'Creative Arts',            department: 'Creative Media', durationMonths: 6 },
  { id: 'c05', code: 'GRS101', name: 'Graphics (Still)',         department: 'Creative Media', durationMonths: 6 },
  { id: 'c06', code: 'GRM101', name: 'Graphics Motion',          department: 'Creative Media', durationMonths: 9 },
  { id: 'c07', code: 'ANI101', name: 'Animation',                department: 'Creative Media', durationMonths: 12 },
  { id: 'c08', code: 'UIG101', name: 'UI Graphics',              department: 'Creative Media', durationMonths: 6 },
  // Audio & Music
  { id: 'c09', code: 'LMP101', name: 'Live Music Production',    department: 'Audio & Music', durationMonths: 9 },
  { id: 'c10', code: 'SND101', name: 'Sound Engineering',        department: 'Audio & Music', durationMonths: 9 },
  { id: 'c11', code: 'AUD101', name: 'Audio Production',         department: 'Audio & Music', durationMonths: 6 },
  { id: 'c12', code: 'AMP101', name: 'Audio Music Production',   department: 'Audio & Music', durationMonths: 9 },
  { id: 'c13', code: 'MXM101', name: 'Mixing & Mastering',       department: 'Audio & Music', durationMonths: 9 },
  { id: 'c14', code: 'AUD201', name: 'Audition',                 department: 'Audio & Music', durationMonths: 3 },
  { id: 'c15', code: 'PRS101', name: 'Presentation',             department: 'Audio & Music', durationMonths: 3 },
  // IT & Technology
  { id: 'c16', code: 'IWB101', name: 'Internet & Web',           department: 'IT & Technology', durationMonths: 3 },
  { id: 'c17', code: 'TRB101', name: 'Troubleshooting',          department: 'IT & Technology', durationMonths: 3 },
  { id: 'c18', code: 'APP101', name: 'Applications',             department: 'IT & Technology', durationMonths: 3 },
  { id: 'c19', code: 'CPR101', name: 'Computer Programming',     department: 'IT & Technology', durationMonths: 12 },
  { id: 'c20', code: 'CRP101', name: 'Computer Repair',          department: 'IT & Technology', durationMonths: 6 },
  { id: 'c21', code: 'ELC101', name: 'Electronics',              department: 'IT & Technology', durationMonths: 6 },
  { id: 'c22', code: 'NET101', name: 'Networking',               department: 'IT & Technology', durationMonths: 9 },
  { id: 'c23', code: 'PHR101', name: 'Phone Repair',             department: 'IT & Technology', durationMonths: 6 },
  { id: 'c24', code: 'WPR101', name: 'Web Programming',          department: 'IT & Technology', durationMonths: 12 },
  { id: 'c25', code: 'MEC101', name: 'Mechatronic Assembly',     department: 'IT & Technology', durationMonths: 12 },
];

// Keep SUBJECTS as alias for backward compat
export const SUBJECTS = COURSES;

// ── Intake Cohorts (replaces rigid "classes") ─────────────────────
export const CLASSES: Class[] = [];

// ── Students ──────────────────────────────────────────────────────
export const STUDENTS: Student[] = [];

// ── Staff ─────────────────────────────────────────────────────────
export const STAFF_LIST: Staff[] = [];

// ── Grades ────────────────────────────────────────────────────────
function makeGrade(id: string, studentId: string, studentName: string, courseId: string, courseName: string, intakeId: string, termId: string, testScore: number, examScore: number, staffName: string): Grade {
  const totalScore = testScore + examScore;
  const g = calcGrade(totalScore);
  return { id, studentId, studentName, subjectId: courseId, subjectName: courseName, classId: intakeId, termId, testScore, examScore, totalScore, ...g, recordedBy: staffName, recordedAt: '2025-04-10' };
}

export const GRADES: Grade[] = [];

export function computeGpaSummary(students: Student[], grades: Grade[], classId: string, termId: string): GpaSummary[] {
  const studentsInClass = students.filter(s => s.classId === classId);
  const summaries = studentsInClass.map(st => {
    const gs  = grades.filter(g => g.studentId === st.id && g.termId === termId);
    const gpa = gs.length ? parseFloat((gs.reduce((a, g) => a + g.gradePoints, 0) / gs.length).toFixed(2)) : 0;
    return { studentId: st.id, studentName: st.fullName, classId, className: st.className, termId, gpa, subjectsGraded: gs.length, classRank: 0, totalStudents: studentsInClass.length };
  });
  summaries.sort((a, b) => b.gpa - a.gpa);
  summaries.forEach((s, i) => { s.classRank = i + 1; s.totalStudents = summaries.length; });
  return summaries;
}

export const ATTENDANCE: AttendanceRecord[] = [];

export function computeAttendanceSummary(students: Student[], attendance: AttendanceRecord[], studentId: string): AttendanceSummary {
  const records = attendance.filter(a => a.studentId === studentId);
  const present = records.filter(a => a.status === 'present').length;
  const absent  = records.filter(a => a.status === 'absent').length;
  const late    = records.filter(a => a.status === 'late').length;
  const excused = records.filter(a => a.status === 'excused').length;
  const total   = records.length;
  const student = students.find(s => s.id === studentId);
  return { studentId, studentName: student?.fullName ?? '', totalDays: total, present, absent, late, excused, percentage: total ? Math.round(((present + late) / total) * 100) : 0 };
}

// ── Payments (UGX) ────────────────────────────────────────────────
export const PAYMENTS: Payment[] = [];

export const CURRENCY = { symbol: 'UGX', code: 'UGX', name: 'Ugandan Shilling' };
export const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;
