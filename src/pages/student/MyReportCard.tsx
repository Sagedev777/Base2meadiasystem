import { useRef } from 'react';
import { Printer, BookOpen, Award, ClipboardCheck, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { computeGpaSummary, computeAttendanceSummary, calcGrade } from '../../data/mockData';
import { useDataStore } from '../../store/dataStore';

export default function MyReportCard() {
  const STUDENTS = useDataStore(s => s.students);
  const TERMS = useDataStore(s => s.terms);
  const CLASSES = useDataStore(s => s.classes);
  const GRADES = useDataStore(s => s.grades);
  const COURSES = useDataStore(s => s.courses);
  const ATTENDANCE = useDataStore(s => s.attendance);

  const user    = useAuthStore(s => s.user)!;
  const student = STUDENTS.find(s => s.email === user.email) ?? STUDENTS[0];

  if (!student) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <h3>No Profile Assigned</h3>
        <p>Your account is not linked to any active student profile yet.</p>
      </div>
    );
  }
  const currentTerm = TERMS.find(t => t.isCurrent)!;
  const cohort  = CLASSES.find(c => c.id === student.classId);
  const att     = computeAttendanceSummary(STUDENTS, ATTENDANCE, student.id);
  const grades  = GRADES.filter(g => g.studentId === student.id && g.termId === currentTerm.id);
  const enrolledCourses = COURSES.filter(c => student.enrolledCourseIds?.includes(c.id));

  const summaries = computeGpaSummary(STUDENTS, GRADES, student.classId, currentTerm.id);
  const gpaEntry  = summaries.find(s => s.studentId === student.id) ?? { gpa: 0, classRank: 0, totalStudents: summaries.length };

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=820,height=1000');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Report Card — ${student.fullName} — ${currentTerm.name}</title>
          <style>
            *{box-sizing:border-box}
            body{font-family:Arial,sans-serif;color:#111;padding:40px;max-width:700px;margin:0 auto}
            h1{font-size:24px;text-align:center;margin:0}
            .sub{text-align:center;color:#555;font-size:13px;margin:6px 0 20px}
            hr{border:none;border-top:2px solid #333;margin:16px 0}
            .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;font-size:13px}
            .lbl{font-weight:700}
            table{width:100%;border-collapse:collapse;margin-top:12px}
            th,td{padding:9px 13px;border:1px solid #ddd;font-size:13px;text-align:left}
            th{background:#f0f0f0;font-weight:700}
            .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px;background:#f9f9f9;padding:16px;border-radius:6px;border:1px solid #ddd;text-align:center}
            .sv{font-size:22px;font-weight:900}.sl{font-size:11px;color:#666}
            .rem{margin-top:18px;background:#f0f4ff;border:1px solid #c7d8fc;border-radius:6px;padding:14px;font-size:13px}
            .sig{display:flex;justify-content:space-between;margin-top:48px}
            .sig-line{text-align:center;width:180px;border-top:1px solid #333;padding-top:6px;font-size:11px;color:#555}
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>My Report Card</h2><p>{currentTerm.name} · Academic Performance Summary</p></div>
        <button id="btn-download-report-card" className="btn btn-student" onClick={handlePrint}>
          <Printer size={14}/> Print / Download PDF
        </button>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <div ref={printRef}>
          {/* Header with photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="Passport" style={{ width: 80, height: 90, objectFit: 'cover', border: '2px solid #333', borderRadius: 4, flexShrink: 0 }}/>
            ) : (
              <div style={{ width: 80, height: 90, background: '#e2e8f0', border: '2px solid #333', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#64748b', flexShrink: 0 }}>
                {student.firstName[0]}{student.lastName[0]}
              </div>
            )}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1>Base2 Science and Media Academy</h1>
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Student Academic Report Card · {currentTerm.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Plot 12, Media Drive, Kampala, Uganda | info@base2media.ac</div>
            </div>
            <div style={{ width: 80 }}/>{/* spacer */}
          </div>
          <hr style={{ borderColor: 'var(--border)' }}/>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              ['Student Name',    student.fullName],
              ['Student ID',      student.studentId],
              ['Class',   cohort?.name ?? '—'],
              ['Academic Term',   currentTerm.name],
              ['Gender',         student.gender],
              ['Enrollment Date', student.enrollmentDate],
              ['Enrolled Course(s)', enrolledCourses.map(c => c.name).join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#94a3b8' }}>{label}: </span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          <hr style={{ borderColor: 'var(--border)' }}/>

          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={15} color="#3b82f6"/> Academic Performance
          </div>

          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead><tr><th>Course</th><th>Test Score</th><th>Exam Score</th><th>Total Score</th><th>Letter Grade</th><th>Grade Points</th><th>Descriptor</th></tr></thead>
              <tbody>
                {grades.length > 0 ? grades.map(g => {
                  const info  = calcGrade(g.totalScore);
                  const color = g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 70 ? '#3b82f6' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 600 }}>{g.subjectName}</td>
                      <td>{g.testScore ?? '—'}</td>
                      <td>{g.examScore ?? '—'}</td>
                      <td style={{ fontWeight: 700, color: '#3b82f6' }}>{g.totalScore}%</td>
                      <td><span style={{ fontWeight: 900, color }}>{info.letterGrade}</span></td>
                      <td>{info.gradePoints.toFixed(1)}</td>
                      <td><span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{info.descriptiveWord}</span></td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No grades recorded for this term</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { icon: <Award size={18}/>,        label: 'Avg Score',        value: gpaEntry.gpa.toFixed(2),                       color: '#a855f7' },
              { icon: <ClipboardCheck size={18}/>,label: 'Attendance', value: `${att.percentage}%`,                           color: att.percentage >= 80 ? '#22c55e' : '#ef4444' },
              { icon: <TrendingUp size={18}/>,    label: 'Class Rank', value: `${gpaEntry.classRank}/${gpaEntry.totalStudents}`, color: '#3b82f6' },
              { icon: <BookOpen size={18}/>,      label: 'Subjects',   value: `${grades.length}`,                            color: '#f97316' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: '14px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ color: item.color, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>📝 Teacher's Remarks</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {gpaEntry.gpa >= 3.5 ? 'Outstanding academic performance. Keep it up!' :
               gpaEntry.gpa >= 3.0 ? 'Good performance. Continue to put in great effort.' :
               gpaEntry.gpa >= 2.0 ? 'Average performance. There is room for improvement.' :
               'Below average. Please consult your teacher for academic support.'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            {['Class Teacher', 'Principal / Head', 'Parent / Guardian'].map(label => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 11, color: '#64748b', minWidth: 160 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
