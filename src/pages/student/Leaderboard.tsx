import { Trophy, Medal, Award } from 'lucide-react';
import { computeGpaSummary } from '../../data/mockData';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';

export default function Leaderboard() {
  const STUDENTS = useDataStore(s => s.students);
  const TERMS = useDataStore(s => s.terms);
  const CLASSES = useDataStore(s => s.classes);
  const GRADES = useDataStore(s => s.grades);

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

  const leaderboard = computeGpaSummary(STUDENTS, GRADES, student.classId, currentTerm.id);

  const rankClass = (rank: number) => rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-n';
  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={14}/>;
    if (rank === 2) return <Medal size={14}/>;
    if (rank === 3) return <Award size={14}/>;
    return rank;
  };
  const gpaColor = (gpa: number) => gpa >= 3.5 ? '#22c55e' : gpa >= 2.5 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div className="page-header">
        <div><h2>Class Leaderboard</h2><p>{CLASSES.find(c => c.id === student.classId)?.name} · {currentTerm.name}</p></div>
        <span className="badge badge-purple">🏆 Top Students</span>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 32 }}>
          {/* 2nd */}
          <div style={{ textAlign: 'center', order: 1 }}>
            {STUDENTS.find(s => s.id === leaderboard[1].studentId)?.photoUrl ? (
              <img src={STUDENTS.find(s => s.id === leaderboard[1].studentId)!.photoUrl} className="avatar avatar-lg" style={{ margin: '0 auto 8px', objectFit: 'cover' }} alt="" />
            ) : (
              <div className="avatar avatar-lg" style={{ margin: '0 auto 8px', background: 'rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: 20 }}>
                {leaderboard[1].studentName.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: 13 }}>{leaderboard[1].studentName.split(' ')[0]}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#94a3b8' }}>{leaderboard[1].gpa.toFixed(2)}</div>
            <div style={{ background: '#1e2d45', borderRadius: '12px 12px 0 0', padding: '16px 24px', marginTop: 8, height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Medal size={24} color="#94a3b8"/>
            </div>
          </div>
          {/* 1st */}
          <div style={{ textAlign: 'center', order: 2 }}>
            <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Champion</div>
            {STUDENTS.find(s => s.id === leaderboard[0].studentId)?.photoUrl ? (
              <img src={STUDENTS.find(s => s.id === leaderboard[0].studentId)!.photoUrl} className="avatar avatar-lg" style={{ margin: '0 auto 8px', objectFit: 'cover', width: 72, height: 72 }} alt="" />
            ) : (
              <div className="avatar avatar-lg" style={{ margin: '0 auto 8px', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 22, width: 72, height: 72 }}>
                {leaderboard[0].studentName.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: 14 }}>{leaderboard[0].studentName.split(' ')[0]}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24' }}>{leaderboard[0].gpa.toFixed(2)}</div>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px 12px 0 0', padding: '16px 32px', marginTop: 8, height: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Trophy size={28} color="#fbbf24"/>
            </div>
          </div>
          {/* 3rd */}
          <div style={{ textAlign: 'center', order: 3 }}>
            {STUDENTS.find(s => s.id === leaderboard[2].studentId)?.photoUrl ? (
              <img src={STUDENTS.find(s => s.id === leaderboard[2].studentId)!.photoUrl} className="avatar avatar-lg" style={{ margin: '0 auto 8px', objectFit: 'cover' }} alt="" />
            ) : (
              <div className="avatar avatar-lg" style={{ margin: '0 auto 8px', background: 'rgba(180,83,9,0.2)', color: '#cd7c2e', fontSize: 20 }}>
                {leaderboard[2].studentName.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: 13 }}>{leaderboard[2].studentName.split(' ')[0]}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#cd7c2e' }}>{leaderboard[2].gpa.toFixed(2)}</div>
            <div style={{ background: '#1e2d45', borderRadius: '12px 12px 0 0', padding: '16px 24px', marginTop: 8, height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Award size={22} color="#cd7c2e"/>
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 24px' }}>
          <div><h3>Full Rankings</h3><p>{leaderboard.length} students ranked by Avg Score</p></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Rank</th><th>Student</th><th>Avg Score</th><th>Grade Points</th><th>Subjects</th><th>Status</th></tr></thead>
            <tbody>
              {leaderboard.map(entry => {
                const isMe = entry.studentId === student.id;
                const color = gpaColor(entry.gpa);
                return (
                  <tr key={entry.studentId} style={isMe ? { background: 'rgba(34,197,94,0.06)', outline: '1px solid rgba(34,197,94,0.2)' } : {}}>
                    <td>
                      <div className={`rank-badge ${rankClass(entry.classRank)}`}>{rankIcon(entry.classRank)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {STUDENTS.find(s => s.id === entry.studentId)?.photoUrl ? (
                          <img src={STUDENTS.find(s => s.id === entry.studentId)!.photoUrl} className="avatar" style={{ objectFit: 'cover', border: isMe ? '2px solid #22c55e' : 'none' }} alt="" />
                        ) : (
                          <div className="avatar" style={{ background: isMe ? '#22c55e22' : '#1e2d45', color: isMe ? '#22c55e' : '#64748b' }}>
                            {entry.studentName.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                        )}
                        <div>
                          <span style={{ fontWeight: 600 }}>{entry.studentName}</span>
                          {isMe && <span className="badge badge-success" style={{ marginLeft: 8, fontSize: 10 }}>You</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 20, fontWeight: 900, color }}>{entry.gpa.toFixed(2)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-wrap" style={{ width: 80 }}>
                          <div className="progress-bar-fill" style={{ width: `${(entry.gpa / 4.0) * 100}%`, background: color }}/>
                        </div>
                        <span style={{ fontSize: 12, color }}>{entry.gpa.toFixed(2)}/4.0</span>
                      </div>
                    </td>
                    <td className="td-muted">{entry.subjectsGraded} subjects</td>
                    <td>
                      <span className="badge" style={{ background: `${color}18`, color }}>
                        {entry.gpa >= 3.5 ? 'Outstanding' : entry.gpa >= 3.0 ? 'Excellent' : entry.gpa >= 2.0 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
