import { Heart, TrendingUp, ClipboardCheck, Trophy, BookOpen } from 'lucide-react';
import { computeGpaSummary, computeAttendanceSummary } from '../../data/mockData';
import { useDataStore } from '../../store/dataStore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function ParentDashboard() {
  const STUDENTS = useDataStore(s => s.students);
  const GRADES = useDataStore(s => s.grades);
  const TERMS = useDataStore(s => s.terms);
  const ATTENDANCE = useDataStore(s => s.attendance);

  const CHILD = STUDENTS[0];

  if (!CHILD) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <h3>No Child Linked</h3>
        <p>Your parent account is not linked to any active student profile yet.<br/>Please contact the administration.</p>
      </div>
    );
  }

  const currentTerm = TERMS.find(t => t.isCurrent)!;
  const childGrades = GRADES.filter(g => g.studentId === CHILD.id && g.termId === currentTerm.id);
  const gpa = childGrades.length
    ? parseFloat((childGrades.reduce((s, g) => s + g.gradePoints, 0) / childGrades.length).toFixed(2))
    : 0;
  const avgScore = childGrades.length ? Math.round(childGrades.reduce((s, g) => s + g.totalScore, 0) / childGrades.length) : 0;
  const att = computeAttendanceSummary(STUDENTS, ATTENDANCE, CHILD.id);
  const leaderboard = computeGpaSummary(STUDENTS, GRADES, CHILD.classId, currentTerm.id);
  const childRank = leaderboard.find(l => l.studentId === CHILD.id);
  const gpaColor = gpa >= 3.5 ? '#22c55e' : gpa >= 2.5 ? '#f59e0b' : '#ef4444';

  const radarData = childGrades.map(g => ({ subject: g.subjectName.split(' ')[0], score: g.totalScore, fullMark: 100 }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Child Progress Dashboard</h2>
          <p>Monitoring {CHILD.fullName} · {currentTerm.name}</p>
        </div>
        <span className="badge badge-muted" style={{ padding: '8px 16px' }}>📅 {currentTerm.name}</span>
      </div>

      {/* Child Profile Banner */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(168,85,247,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {CHILD.photoUrl ? (
            <img src={CHILD.photoUrl} className="avatar" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }} alt="" />
          ) : (
            <div className="avatar" style={{ width: 72, height: 72, fontSize: 26, fontWeight: 900, background: '#f9731618', color: '#f97316', flexShrink: 0 }}>
              {CHILD.firstName[0]}{CHILD.lastName[0]}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{CHILD.fullName}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{CHILD.email} · {CHILD.phone}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{CHILD.className}</span>
              <span className="badge badge-success">{CHILD.status}</span>
              <span className="badge badge-muted">{CHILD.studentId}</span>
              <span className="badge badge-muted">Enrolled {CHILD.enrollmentDate}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: gpaColor, lineHeight: 1 }}>{gpa.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>GPA</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>
                #{childRank?.classRank ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Class Rank</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: att.percentage >= 80 ? '#22c55e' : '#ef4444', lineHeight: 1 }}>
                {att.percentage}%
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Attendance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stat-grid">
        {[
          { icon: <TrendingUp size={22}/>,     label: 'Average Score',   value: `${avgScore}%`,   color: '#f97316' },
          { icon: <BookOpen size={22}/>,       label: 'Subjects',        value: childGrades.length, color: '#a855f7' },
          { icon: <ClipboardCheck size={22}/>, label: 'Days Present',    value: att.present,       color: '#22c55e' },
          { icon: <Trophy size={22}/>,         label: 'Class Rank',      value: childRank ? `#${childRank.classRank} of ${childRank.totalStudents}` : '—', color: '#f59e0b' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color, fontSize: typeof s.value === 'string' && s.value.length > 6 ? 20 : 28 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Subject Performance Radar */}
        <div className="card">
          <div className="card-header"><div><h3>Subject Performance</h3><p>Score per subject</p></div></div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e2d45"/>
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }}/>
              <Radar name="Score" dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2}/>
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#f0f4ff' }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Breakdown */}
        <div className="card">
          <div className="card-header"><div><h3>Attendance Breakdown</h3><p>This term</p></div></div>
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
            {att.absent > 0 && (
              <div style={{ marginTop: 4, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171' }}>
                ⚠ Your child was absent {att.absent} day{att.absent !== 1 ? 's' : ''}. Please check with the school.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grade Details */}
      <div className="card" style={{ marginTop: 20, padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 24px' }}>
          <div><h3>{CHILD.firstName}'s Grades</h3><p>All subjects · {currentTerm.name}</p></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: gpaColor }}>GPA {gpa.toFixed(2)}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Descriptor</th><th>Teacher</th></tr></thead>
            <tbody>
              {childGrades.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>{g.subjectName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-wrap" style={{ width: 70 }}>
                        <div className="progress-bar-fill" style={{ width: `${g.totalScore}%`, background: g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444' }}/>
                      </div>
                      <span style={{ fontWeight: 700 }}>{g.totalScore}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 18, color: g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444' }}>{g.letterGrade}</td>
                  <td><span className="badge badge-info">{g.descriptiveWord}</span></td>
                  <td className="td-muted">{g.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Leaderboard context */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><div><h3>Class Ranking Context</h3><p>{CHILD.className} — Top performers</p></div></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leaderboard.slice(0, 5).map(entry => {
            const isChild = entry.studentId === CHILD.id;
            const color = entry.gpa >= 3.5 ? '#22c55e' : entry.gpa >= 2.5 ? '#f59e0b' : '#ef4444';
            return (
              <div key={entry.studentId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: isChild ? 'rgba(249,115,22,0.08)' : 'var(--bg-surface)', border: isChild ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent' }}>
                <div className={`rank-badge ${entry.classRank <= 3 ? `rank-${entry.classRank}` : 'rank-n'}`}>{entry.classRank}</div>
                <div style={{ flex: 1, fontWeight: isChild ? 700 : 500 }}>
                  {entry.studentName} {isChild && <Heart size={12} style={{ display: 'inline', color: '#f97316', marginLeft: 4 }}/>}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color }}>{entry.gpa.toFixed(2)} GPA</div>
              </div>
            );
          })}
          {childRank && childRank.classRank > 5 && (
            <>
              <div style={{ textAlign: 'center', color: '#4b6080', fontSize: 12 }}>···</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)' }}>
                <div className="rank-badge rank-n">{childRank.classRank}</div>
                <div style={{ flex: 1, fontWeight: 700 }}>{CHILD.fullName} <Heart size={12} style={{ display: 'inline', color: '#f97316', marginLeft: 4 }}/></div>
                <div style={{ fontWeight: 800, fontSize: 16, color: gpaColor }}>{childRank.gpa.toFixed(2)} GPA</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
