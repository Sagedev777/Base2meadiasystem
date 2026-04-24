import { calcGrade } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';

function gradeBadgeColor(score: number) {
  if (score >= 90) return '#a855f7';
  if (score >= 80) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  if (score >= 50) return '#f97316';
  if (score >= 30) return '#ef4444';
  return '#7f1d1d';
}

export default function MyGrades() {
  const STUDENTS = useDataStore(s => s.students);
  const GRADES = useDataStore(s => s.grades);
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
  const gpa = myGrades.length
    ? parseFloat((myGrades.reduce((s, g) => s + g.gradePoints, 0) / myGrades.length).toFixed(2))
    : 0;
  const avgScore = myGrades.length ? Math.round(myGrades.reduce((s, g) => s + g.totalScore, 0) / myGrades.length) : 0;
  const highest = myGrades.length ? Math.max(...myGrades.map(g => g.totalScore)) : 0;
  const lowest  = myGrades.length ? Math.min(...myGrades.map(g => g.totalScore)) : 0;

  const gpaCalc = calcGrade(avgScore);

  return (
    <div>
      <div className="page-header">
        <div><h2>My Grades</h2><p>{currentTerm.name} · {student.className}</p></div>
        <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: 13 }}>GPA: {gpa.toFixed(2)}</span>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'GPA', value: gpa.toFixed(2), color: '#22c55e', sub: gpaCalc.descriptiveWord },
          { label: 'Average Score', value: `${avgScore}%`, color: '#3b82f6', sub: `${gpaCalc.letterGrade} Grade` },
          { label: 'Highest Score', value: `${highest}%`, color: '#a855f7', sub: myGrades.find(g => g.totalScore === highest)?.subjectName ?? '' },
          { label: 'Lowest Score', value: `${lowest}%`, color: '#f97316', sub: myGrades.find(g => g.totalScore === lowest)?.subjectName ?? '' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color }}>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Grade Cards */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {myGrades.map(g => {
          const color = gradeBadgeColor(g.totalScore);
          return (
            <div className="card" key={g.id} style={{ borderLeft: `4px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{g.subjectName}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Recorded by {g.recordedBy}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1 }}>{g.letterGrade}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{g.descriptiveWord}</div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Score Breakdown</span>
                  <span style={{ fontWeight: 700, color }}>Test: {g.testScore ?? 0} | Exam: {g.examScore ?? 0} | Total: {g.totalScore}</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${g.totalScore}%`, background: color }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Grade Points</span>
                  <span style={{ fontWeight: 600, color: '#94a3b8' }}>{g.gradePoints.toFixed(1)} / 4.0</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grading scale reminder */}
      <div className="card">
        <div className="card-header"><h3>Grading Scale</h3></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { range: '90–100', letter: 'A+', word: 'Outstanding', color: '#a855f7' },
            { range: '80–89',  letter: 'A',  word: 'Excellent',   color: '#22c55e' },
            { range: '70–79',  letter: 'B',  word: 'Good',        color: '#3b82f6' },
            { range: '60–69',  letter: 'C',  word: 'Average',     color: '#f59e0b' },
            { range: '50–59',  letter: 'D',  word: 'Poor',        color: '#f97316' },
            { range: '30–49',  letter: 'F',  word: 'Failed',      color: '#ef4444' },
            { range: '0–29',   letter: 'F-', word: 'Worst',       color: '#7f1d1d' },
          ].map(g => (
            <div key={g.letter} style={{ padding: '8px 14px', borderRadius: 10, background: `${g.color}12`, border: `1px solid ${g.color}30`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: g.color }}>{g.letter}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: g.color }}>{g.word}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{g.range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
