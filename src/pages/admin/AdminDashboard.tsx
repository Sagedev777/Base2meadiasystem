import { Users, UserCog, DollarSign, TrendingUp, GraduationCap, AlertCircle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { STUDENTS, STAFF_LIST, PAYMENTS, CLASSES, TERMS, ATTENDANCE } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const currentTerm   = TERMS.find(t => t.isCurrent)!;
const totalRevenue  = PAYMENTS.reduce((s, p) => s + p.amountPaid, 0);
const outstanding   = PAYMENTS.reduce((s, p) => s + p.balance, 0);
const activeStudents = STUDENTS.filter(s => s.status === 'active').length;
const enrollmentData = CLASSES.map(c => ({ name: c.name.slice(0, 18), students: c.studentCount, capacity: c.capacity }));

const paymentStatusData = [
  { name: 'Paid',    value: PAYMENTS.filter(p => p.status === 'paid').length,    color: '#22c55e' },
  { name: 'Partial', value: PAYMENTS.filter(p => p.status === 'partial').length, color: '#f59e0b' },
  { name: 'Unpaid',  value: PAYMENTS.filter(p => p.status === 'unpaid').length,  color: '#ef4444' },
];

const recentStudents = STUDENTS.slice(0, 5);

// ── Build attendance heatmap data ─────────────────────────────
// Get last 5 unique dates from ATTENDANCE records
const allDates = [...new Set(ATTENDANCE.map(a => a.date))].sort().reverse().slice(0, 5);
const CLASSES_IDS = [...new Set(STUDENTS.map(s => s.classId))];

const heatmapData = allDates.map(date => {
  const dayRecords = ATTENDANCE.filter(a => a.date === date);
  const totalPresent = dayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
  const total = dayRecords.length || 1;
  return { date, rate: Math.round((totalPresent / total) * 100), total: dayRecords.length };
});

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Administrator Dashboard</h2>
          <p>Welcome back! Here's what's happening at Base 2 Media Academy.</p>
        </div>
        <span className="badge badge-purple">📅 {currentTerm.name}</span>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {[
          { icon: <Users size={22}/>, label: 'Active Students', value: activeStudents, color: '#a855f7', delta: '+3 this term', path: '/admin/students' },
          { icon: <UserCog size={22}/>, label: 'Staff Members', value: STAFF_LIST.length, color: '#3b82f6', delta: 'All active', path: '/admin/staff' },
          { icon: <GraduationCap size={22}/>, label: 'Classes', value: CLASSES.length, color: '#22c55e', delta: currentTerm.name, path: '/admin/academic' },
          { icon: <DollarSign size={22}/>, label: 'Total Revenue', value: `UGX ${totalRevenue.toLocaleString()}`, color: '#f97316', delta: `UGX ${outstanding.toLocaleString()} outstanding`, path: '/admin/financials' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color, cursor: 'pointer' }} onClick={() => navigate(s.path)}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-delta">{s.delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div><h3>Class Enrollment</h3><p>Students per class vs capacity</p></div>
            <TrendingUp size={16} color="#94a3b8"/>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enrollmentData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false}/>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#f0f4ff' }}/>
              <Bar dataKey="students" fill="#a855f7" radius={[4,4,0,0]} name="Enrolled"/>
              <Bar dataKey="capacity" fill="#1e2d45" radius={[4,4,0,0]} name="Capacity"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div><h3>Fee Payment Status</h3><p>Current term breakdown</p></div>
            <DollarSign size={16} color="#94a3b8"/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {paymentStatusData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#f0f4ff' }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 110 }}>
              {paymentStatusData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{d.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Heatmap */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div><h3>Attendance Overview</h3><p>School-wide attendance rate — last 5 recorded days</p></div>
          <Activity size={16} color="#94a3b8"/>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {heatmapData.length === 0 ? (
            <div style={{ color: '#4b6080', fontSize: 13 }}>No attendance data yet.</div>
          ) : heatmapData.map(day => {
            const color = day.rate >= 90 ? '#22c55e' : day.rate >= 75 ? '#f59e0b' : day.rate >= 50 ? '#f97316' : '#ef4444';
            return (
              <div key={day.date} style={{ flex: 1, minWidth: 120, padding: '16px', borderRadius: 12, background: `${color}12`, border: `1px solid ${color}30`, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{day.date}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{day.rate}%</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{day.total} records</div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: '#1e2d45', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${day.rate}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }}/>
                </div>
              </div>
            );
          })}
          {heatmapData.length > 0 && (
            <div style={{ flex: 1, minWidth: 120, padding: '16px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Average Rate</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#a855f7' }}>
                {Math.round(heatmapData.reduce((s, d) => s + d.rate, 0) / heatmapData.length)}%
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Last {heatmapData.length} days</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          {[{ label: '≥90% Excellent', color: '#22c55e' }, { label: '75–89% Good', color: '#f59e0b' }, { label: '50–74% Fair', color: '#f97316' }, { label: '<50% Poor', color: '#ef4444' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }}/>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Students */}
      <div className="card">
        <div className="card-header">
          <div><h3>Recent Students</h3><p>Latest enrolled students</p></div>
          <button id="btn-view-all-students" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/students')}>View All</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Student</th><th>ID</th><th>Class</th><th>Enrolled</th><th>Status</th>
            </tr></thead>
            <tbody>
              {recentStudents.map(st => (
                <tr key={st.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: '#a855f718', color: '#a855f7' }}>
                        {st.firstName[0]}{st.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{st.fullName}</div>
                        <div className="td-muted">{st.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-muted">{st.studentId}</td>
                  <td><span className="badge badge-info">{st.className}</span></td>
                  <td className="td-muted">{st.enrollmentDate}</td>
                  <td><span className={`badge ${st.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{st.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outstanding Fees Alert */}
      <div style={{ marginTop: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertCircle size={18} color="#f59e0b"/>
        <div>
          <span style={{ fontWeight: 600, color: '#fbbf24', fontSize: 13 }}>Outstanding Fees: </span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {PAYMENTS.filter(p => p.status !== 'paid').length} students have pending payments totalling <strong style={{ color: '#fbbf24' }}>UGX {outstanding.toLocaleString()}</strong>
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/admin/financials')}>View →</button>
      </div>
    </div>
  );
}
