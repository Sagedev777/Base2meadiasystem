import { useState } from 'react';
import { Printer, BookOpen, Users } from 'lucide-react';
import { calcGrade, computeGpaSummary, computeAttendanceSummary } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { Student, Grade } from '../../types';

const PRINT_CSS = `
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#111;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:22px;text-align:center;margin:0}
  .sub{text-align:center;color:#555;font-size:12px;margin:4px 0 16px}
  hr{border:none;border-top:2px solid #333;margin:12px 0}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;font-size:12px}
  .lbl{font-weight:700}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th,td{padding:8px 12px;border:1px solid #ddd;font-size:12px;text-align:left}
  th{background:#f0f0f0;font-weight:700}
  .sum{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0;background:#f9f9f9;padding:12px;border-radius:4px;border:1px solid #ddd;text-align:center}
  .sv{font-size:20px;font-weight:900}.sl{font-size:10px;color:#666}
  .rem{margin-top:12px;background:#eef2ff;border:1px solid #c7d8fc;border-radius:4px;padding:10px;font-size:12px}
  .sig{display:flex;justify-content:space-between;margin-top:36px}
  .sl2{text-align:center;width:180px;border-top:1px solid #333;padding-top:4px;font-size:10px;color:#555}
  .page-break{page-break-after:always;margin-bottom:32px;padding-bottom:32px;border-bottom:2px dashed #ccc}
  .header-flex{display:flex;align-items:center;gap:20px;margin-bottom:16px}
  .avatar{width:70px;height:80px;object-fit:cover;border:2px solid #333;border-radius:4px;flex-shrink:0}
  .avatar-fallback{width:70px;height:80px;background:#e2e8f0;border:2px solid #333;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#64748b;flex-shrink:0}
  .header-text{flex:1;text-align:center}
`;

/** Helper: get the GPA entry for a single student from a class summary */
function getStudentGpa(students: Student[], grades: Grade[], studentId: string, classId: string, termId: string) {
  const summaries = computeGpaSummary(students, grades, classId, termId);
  return summaries.find(s => s.studentId === studentId) ?? { gpa: 0, classRank: 0, totalStudents: summaries.length };
}

export default function ReportCards() {
  const STUDENTS = useDataStore(s => s.students);
  const CLASSES = useDataStore(s => s.classes);
  const TERMS = useDataStore(s => s.terms);
  const GRADES = useDataStore(s => s.grades);
  const STAFF_LIST = useDataStore(s => s.staff);
  const COURSES = useDataStore(s => s.courses);
  const ATTENDANCE = useDataStore(s => s.attendance);

  const user = useAuthStore(s => s.user)!;
  const staffProfile = STAFF_LIST.find(sf => sf.email === user.email) ?? STAFF_LIST[0];

  if (!staffProfile || !staffProfile.classes || staffProfile.classes.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <h3>No Classes Assigned</h3>
        <p>You have not been assigned to any intake cohorts yet.<br/>Please contact the administration.</p>
      </div>
    );
  }

  const currentTerm = TERMS.find(t => t.isCurrent)!;

  const [selClass, setSelClass]     = useState(staffProfile.classes[0] ?? 'c1');
  const [selStudent, setSelStudent] = useState('');
  const [preview, setPreview]       = useState(false);

  const myClasses       = CLASSES.filter(c => staffProfile.classes.includes(c.id));
  const studentsInClass = STUDENTS.filter(s => s.classId === selClass);
  const selectedStudent = studentsInClass.find(s => s.id === selStudent) ?? studentsInClass[0];
  const isBatch         = selStudent === '';

  const getRemarks = (gpa: number) =>
    gpa >= 3.5 ? 'Excellent performance. Keep up the outstanding work!' :
    gpa >= 3.0 ? 'Good academic performance. Continue to put in effort.' :
    gpa >= 2.0 ? 'Average performance. There is room for improvement.' :
    'Below average. Please consult your teacher for academic support.';

  const buildCardHTML = (student: Student) => {
    const grades    = GRADES.filter(g => g.studentId === student.id && g.termId === currentTerm.id);
    const gpaEntry  = getStudentGpa(STUDENTS, GRADES, student.id, student.classId, currentTerm.id);
    const att       = computeAttendanceSummary(STUDENTS, ATTENDANCE, student.id);
    const cls       = CLASSES.find(c => c.id === student.classId);
    const total     = computeGpaSummary(STUDENTS, GRADES, student.classId, currentTerm.id).length;
    const enrolledCourses = COURSES.filter(c => student.enrolledCourseIds?.includes(c.id));

    const gradeRows = grades.map(g => {
      const info = calcGrade(g.totalScore);
      const col  = g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 70 ? '#3b82f6' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444';
      return `<tr>
        <td>${g.subjectName}</td>
        <td>${g.testScore ?? '—'}</td>
        <td>${g.examScore ?? '—'}</td>
        <td style="font-weight:700;color:#3b82f6">${g.totalScore}%</td>
        <td style="font-weight:900;color:${col}">${info.letterGrade}</td>
        <td>${info.gradePoints.toFixed(1)}</td>
        <td>${info.descriptiveWord}</td>
      </tr>`;
    }).join('');

    const photoHtml = student.photoUrl 
      ? `<img src="${student.photoUrl}" class="avatar" alt="Passport"/>`
      : `<div class="avatar-fallback">${student.firstName[0]}${student.lastName[0]}</div>`;

    return `
      <div class="header-flex">
        ${photoHtml}
        <div class="header-text">
          <h1>Base 2 Media Academy</h1>
          <div class="sub" style="margin-bottom:4px">Student Academic Report Card · ${currentTerm.name}</div>
          <div style="font-size:10px;color:#555">Plot 12, Media Drive, Kampala, Uganda | info@base2media.ac</div>
        </div>
        <div style="width:70px"></div>
      </div>
      <hr/>
      <div class="info-grid">
        <div><span class="lbl">Student Name:</span> ${student.fullName}</div>
        <div><span class="lbl">Student ID:</span> ${student.studentId}</div>
        <div><span class="lbl">Intake Cohort:</span> ${cls?.name ?? '—'}</div>
        <div><span class="lbl">Academic Term:</span> ${currentTerm.name}</div>
        <div><span class="lbl">Gender:</span> ${student.gender}</div>
        <div><span class="lbl">Enrollment Date:</span> ${student.enrollmentDate}</div>
        <div style="grid-column: 1 / -1"><span class="lbl">Enrolled Course(s):</span> ${enrolledCourses.map(c => c.name).join(', ') || '—'}</div>
      </div>
      <hr/>
      <strong>Academic Performance</strong>
      <table>
        <thead><tr><th>Course</th><th>Test Score</th><th>Exam Score</th><th>Total Score</th><th>Grade</th><th>Points</th><th>Descriptor</th></tr></thead>
        <tbody>${gradeRows || '<tr><td colspan="7" style="text-align:center;color:#999">No grades recorded</td></tr>'}</tbody>
      </table>
      <div class="sum">
        <div><div class="sv" style="color:#a855f7">${gpaEntry.gpa.toFixed(2)}</div><div class="sl">GPA</div></div>
        <div><div class="sv" style="color:${att.percentage >= 80 ? '#22c55e' : '#ef4444'}">${att.percentage}%</div><div class="sl">Attendance</div></div>
        <div><div class="sv" style="color:#3b82f6">${gpaEntry.classRank}/${total}</div><div class="sl">Class Rank</div></div>
        <div><div class="sv" style="color:#f97316">${grades.length}</div><div class="sl">Subjects</div></div>
      </div>
      <div class="rem"><strong>Teacher's Remarks:</strong> ${getRemarks(gpaEntry.gpa)}</div>
      <div class="sig">
        ${[`Class Teacher: ${staffProfile.fullName}`, 'Principal / Head', 'Parent / Guardian']
          .map(l => `<div class="sl2">${l}</div>`).join('')}
      </div>
    `;
  };

  const handlePrint = () => {
    const students = isBatch ? studentsInClass : [selectedStudent].filter(Boolean) as typeof STUDENTS;
    if (!students.length) return;
    const cards = students.map((s, i) => {
      const isLast = i === students.length - 1;
      return `<div class="${isLast ? '' : 'page-break'}">${buildCardHTML(s)}</div>`;
    }).join('');
    const win = window.open('', '_blank', 'width=820,height=1050');
    if (!win) return;
    win.document.write(`<html><head><title>Report Cards — ${currentTerm.name}</title><style>${PRINT_CSS}</style></head><body>${cards}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Report Cards</h2><p>Generate and print student academic report cards</p></div>
        {preview && (
          <button id="btn-print-report" className="btn btn-staff" onClick={handlePrint}>
            <Printer size={14}/> {isBatch ? `Print All (${studentsInClass.length})` : 'Print Report Card'}
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Class</label>
            <select id="rc-sel-class" className="form-select" value={selClass} onChange={e => { setSelClass(e.target.value); setSelStudent(''); setPreview(false); }}>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Student</label>
            <select id="rc-sel-student" className="form-select" value={selStudent} onChange={e => { setSelStudent(e.target.value); setPreview(false); }}>
              <option value="">All Students (Batch Print)</option>
              {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
          <button id="btn-generate-report" className="btn btn-primary" style={{ marginBottom: 0 }} onClick={() => { if (studentsInClass.length) setPreview(true); }}>
            <BookOpen size={14}/> {selStudent ? 'Generate Report Card' : `Generate All (${studentsInClass.length})`}
          </button>
        </div>
        {isBatch && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(168,85,247,0.06)', borderRadius: 8, fontSize: 12, color: '#a855f7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={13}/> Batch mode — will generate report cards for all {studentsInClass.length} students with page breaks
          </div>
        )}
      </div>

      {preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(isBatch ? studentsInClass : [selectedStudent].filter(Boolean) as typeof STUDENTS).map(student => {
            const grades    = GRADES.filter(g => g.studentId === student.id && g.termId === currentTerm.id);
            const gpaEntry  = getStudentGpa(STUDENTS, GRADES, student.id, student.classId, currentTerm.id);
            const att       = computeAttendanceSummary(STUDENTS, ATTENDANCE, student.id);
            const cls       = CLASSES.find(c => c.id === student.classId);
            const total     = computeGpaSummary(STUDENTS, GRADES, student.classId, currentTerm.id).length;

            return (
              <div key={student.id} className="card" style={{ padding: 28 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>Base 2 Media Academy</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Student Academic Report Card · {currentTerm.name}</div>
                </div>
                <hr style={{ borderColor: 'var(--border)', margin: '12px 0' }}/>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[['Student Name', student.fullName], ['Student ID', student.studentId], ['Class', cls?.name ?? '—'], ['Term', currentTerm.name]].map(([l, v]) => (
                    <div key={l} style={{ fontSize: 12 }}><span style={{ fontWeight: 700, color: '#64748b' }}>{l}: </span>{v}</div>
                  ))}
                </div>
                <div className="table-wrap" style={{ marginBottom: 14 }}>
                  <table>
                    <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Points</th><th>Descriptor</th></tr></thead>
                    <tbody>
                      {grades.length > 0 ? grades.map(g => {
                        const info  = calcGrade(g.totalScore);
                        const color = g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 70 ? '#3b82f6' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444';
                        return <tr key={g.id}>
                          <td style={{ fontWeight: 600 }}>{g.subjectName}</td>
                          <td style={{ fontWeight: 700 }}>{g.totalScore}%</td>
                          <td><span style={{ fontWeight: 900, color }}>{info.letterGrade}</span></td>
                          <td>{info.gradePoints.toFixed(1)}</td>
                          <td><span className="badge" style={{ background: `${color}18`, color }}>{info.descriptiveWord}</span></td>
                        </tr>;
                      }) : <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: 16 }}>No grades recorded</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'GPA',        value: gpaEntry.gpa.toFixed(2),             color: '#a855f7' },
                    { label: 'Attendance', value: `${att.percentage}%`,                color: att.percentage >= 80 ? '#22c55e' : '#ef4444' },
                    { label: 'Class Rank', value: `${gpaEntry.classRank}/${total}`,    color: '#3b82f6' },
                    { label: 'Subjects',   value: String(grades.length),               color: '#f97316' },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: 'center', padding: 10, background: 'var(--bg-surface)', borderRadius: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, fontSize: 12, color: '#94a3b8' }}>
                  <strong style={{ color: '#3b82f6' }}>Remarks: </strong>{getRemarks(gpaEntry.gpa)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!preview && (
        <div className="empty-state">
          <div className="icon"><BookOpen size={48} style={{ opacity: 0.2 }}/></div>
          <p>Select a class, optionally a student, then click <strong>Generate</strong>.</p>
          <p style={{ fontSize: 12, color: '#4b6080', marginTop: 8 }}>Leave student as "All Students" to generate batch report cards for the entire class.</p>
        </div>
      )}
    </div>
  );
}
