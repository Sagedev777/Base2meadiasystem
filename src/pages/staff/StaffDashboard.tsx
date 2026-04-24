import { BookOpen, Users, ClipboardCheck, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function StaffDashboard() {
  const STAFF_LIST = useDataStore(s => s.staff);
  const GRADES = useDataStore(s => s.grades);
  const ATTENDANCE = useDataStore(s => s.attendance);
  const CLASSES = useDataStore(s => s.classes);
  const TERMS = useDataStore(s => s.terms);

  const user = useAuthStore(s => s.user)!;
  const staffProfile = STAFF_LIST.find(sf => sf.email === user.email) ?? STAFF_LIST[0];

  if (!staffProfile) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <h3>No Profile Assigned</h3>
        <p>Your account is not linked to any active staff profile yet.</p>
      </div>
    );
  }

  const currentTerm = TERMS.find(t => t.isCurrent)!;

  const myGrades = GRADES.filter(g => g.recordedBy === staffProfile.fullName);
  const myAttendance = ATTENDANCE.filter(a => staffProfile.classes.includes(a.classId));
  const myClasses = CLASSES.filter(c => staffProfile.classes.includes(c.id));

  // Average score per subject for radar
  const subjectAvgs = staffProfile.subjects.map(code => {
    const sg = myGrades.filter(g => g.subjectId === code.replace('101','') || g.subjectName.includes(code.split('1')[0]));
    const avg = sg.length ? Math.round(sg.reduce((s,g) => s + g.totalScore, 0) / sg.length) : 0;
    return { subject: code, avg };
  });

  const todayStr = new Date().toISOString().slice(0,10);
  const todayAtt = myAttendance.filter(a => a.date === '2025-04-16');
  const presentToday = todayAtt.filter(a => a.status === 'present').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome, {staffProfile.firstName}!</h2>
          <p>{staffProfile.department} · {currentTerm.name}</p>
        </div>
        <span className="badge badge-info">📅 {currentTerm.name}</span>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { icon: <Users size={22}/>,       label: 'My Classes',        value: myClasses.length,         color: '#3b82f6' },
          { icon: <BookOpen size={22}/>,    label: 'Grades Recorded',   value: myGrades.length,          color: '#a855f7' },
          { icon: <ClipboardCheck size={22}/>,label:'Attendance Today', value: `${presentToday} present`,color: '#22c55e' },
          { icon: <Star size={22}/>,        label: 'Avg Class Score',   value: myGrades.length ? `${Math.round(myGrades.reduce((s,g)=>s+g.totalScore,0)/myGrades.length)}%` : '—', color: '#f97316' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color, fontSize: 26 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* My Classes */}
        <div className="card">
          <div className="card-header"><div><h3>My Classes</h3><p>Assigned this term</p></div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myClasses.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{c.studentCount} students</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Capacity</div>
                  <div style={{ fontWeight: 700, color: '#3b82f6' }}>{c.studentCount}/{c.capacity}</div>
                  <div className="progress-bar-wrap" style={{ marginTop: 4, width: 80 }}>
                    <div className="progress-bar-fill" style={{ width: `${(c.studentCount/c.capacity)*100}%`, background: '#3b82f6' }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="card">
          <div className="card-header"><div><h3>Recent Grades</h3><p>Last recorded</p></div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myGrades.slice(0, 6).map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{g.studentName}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{g.subjectName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: g.totalScore >= 80 ? '#22c55e' : g.totalScore >= 60 ? '#f59e0b' : '#ef4444' }}>{g.totalScore}%</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{g.letterGrade} · {g.descriptiveWord}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
