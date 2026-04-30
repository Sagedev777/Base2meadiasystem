import { TrendingUp, BookOpen, ClipboardCheck, Trophy } from 'lucide-react';
import { computeGpaSummary, computeAttendanceSummary } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const STUDENTS = useDataStore(s => s.students);
  const GRADES = useDataStore(s => s.grades);
  const ATTENDANCE = useDataStore(s => s.attendance);
  const TERMS = useDataStore(s => s.terms);

  const user = useAuthStore(s => s.user)!;
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

  const myGrades = GRADES.filter(g => g.studentId === student.id && g.termId === currentTerm.id);
  const gpa = myGrades.length ? parseFloat((myGrades.reduce((s, g) => s + g.gradePoints, 0) / myGrades.length).toFixed(2)) : 0;
  const avgScore = myGrades.length ? Math.round(myGrades.reduce((s, g) => s + g.totalScore, 0) / myGrades.length) : 0;
  const att = computeAttendanceSummary(STUDENTS, ATTENDANCE, student.id);
  const leaderboard = computeGpaSummary(STUDENTS, GRADES, student.classId, currentTerm.id);
  const myRank = leaderboard.find(l => l.studentId === student.id);

  const trendData = myGrades.map(g => ({ subject: g.subjectName.split(' ')[0], score: g.totalScore }));

  const gpaColor = gpa >= 3.5 ? '#22c55e' : gpa >= 2.5 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome, {student.firstName}! 👋</h2>
          <p>{student.className} · {currentTerm.name}</p>
        </div>
        <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: 13 }}>{student.studentId}</span>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(59,130,246,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar avatar-lg" style={{ background: '#22c55e22', color: '#22c55e', fontSize: 26, fontWeight: 900 }}>
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{student.fullName}</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>{student.email}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{student.className}</span>
              <span className="badge badge-success">{student.status}</span>
              <span className="badge badge-muted">📅 Enrolled {student.enrollmentDate}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: gpaColor, lineHeight: 1 }}>{gpa.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Avg Score</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { icon: <TrendingUp size={22}/>,    label: 'Average Score',    value: `${avgScore}%`,          color: '#22c55e' },
          { icon: <BookOpen size={22}/>,      label: 'Subjects',         value: myGrades.length,          color: '#3b82f6' },
          { icon: <ClipboardCheck size={22}/>,label: 'Attendance Rate',  value: `${att.percentage}%`,     color: '#f97316' },
          { icon: <Trophy size={22}/>,        label: 'Class Rank',       value: myRank ? `#${myRank.classRank}` : '—', color: '#a855f7' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Score trend */}
        <div className="card">
          <div className="card-header"><div><h3>Score by Subject</h3><p>{currentTerm.name}</p></div></div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false}/>
              <XAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#f0f4ff' }}/>
              <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance breakdown */}
        <div className="card">
          <div className="card-header"><div><h3>Attendance Summary</h3><p>This term</p></div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Present', val: att.present, color: '#22c55e' },
              { label: 'Late',    val: att.late,    color: '#f59e0b' },
              { label: 'Absent',  val: att.absent,  color: '#ef4444' },
              { label: 'Excused', val: att.excused, color: '#3b82f6' },
            ].map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, fontSize: 12, color: a.color, fontWeight: 600 }}>{a.label}</div>
                <div className="progress-bar-wrap" style={{ flex: 1 }}>
                  <div className="progress-bar-fill" style={{ width: att.totalDays ? `${(a.val/att.totalDays)*100}%` : '0%', background: a.color }}/>
                </div>
                <div style={{ width: 30, fontSize: 12, fontWeight: 700, color: a.color, textAlign: 'right' }}>{a.val}</div>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 28, fontWeight: 900, color: att.percentage >= 80 ? '#22c55e' : '#ef4444' }}>
              {att.percentage}% <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>attendance rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Grades Summary */}
      <div className="card" style={{ marginTop: 20, padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 24px' }}>
          <div><h3>My Grades This Term</h3><p>{currentTerm.name}</p></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Points</th><th>Descriptor</th></tr></thead>
            <tbody>
              {myGrades.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>{g.subjectName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-wrap" style={{ width: 80 }}>
                        <div className="progress-bar-fill" style={{ width: `${g.totalScore}%`, background: g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444' }}/>
                      </div>
                      <span style={{ fontWeight: 700 }}>{g.totalScore}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 18, color: g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444' }}>{g.letterGrade}</td>
                  <td style={{ fontWeight: 600, color: '#94a3b8' }}>{g.gradePoints.toFixed(1)}</td>
                  <td><span className="badge badge-info">{g.descriptiveWord}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
