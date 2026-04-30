import { Users, UserCog, GraduationCap, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../../store/dataStore';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const students  = useDataStore(s => s.students);
  const staff     = useDataStore(s => s.staff);
  const classes   = useDataStore(s => s.classes);
  const payments  = useDataStore(s => s.payments);
  const attendance = useDataStore(s => s.attendance);
  const terms     = useDataStore(s => s.terms);

  const currentTerm    = terms.find(t => t.isCurrent);
  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalRevenue   = payments.reduce((s, p) => s + p.amountPaid, 0);
  const outstanding    = payments.reduce((s, p) => s + p.balance, 0);

  const enrollmentData = classes.map(c => ({
    name:     c.name.slice(0, 18),
    students: c.studentCount ?? 0,
    capacity: c.capacity,
  }));

  const paymentStatusData = [
    { name: 'Paid',    value: payments.filter(p => p.status === 'paid').length,    color: '#22c55e' },
    { name: 'Partial', value: payments.filter(p => p.status === 'partial').length, color: '#f59e0b' },
    { name: 'Unpaid',  value: payments.filter(p => p.status === 'unpaid').length,  color: '#ef4444' },
  ];

  const recentStudents = students.slice(-5).reverse();

  // Attendance heatmap — last 5 unique dates from real records
  const allDates = [...new Set(attendance.map(a => a.date))].sort().reverse().slice(0, 5);
  const heatmapData = allDates.map(date => {
    const dayRecords   = attendance.filter(a => a.date === date);
    const totalPresent = dayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const total        = dayRecords.length || 1;
    return { date, rate: Math.round((totalPresent / total) * 100), total: dayRecords.length };
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Administrator Dashboard</h2>
          <p>Welcome back! Here's what's happening at Base2 Science and Media Academy.</p>
        </div>
        {currentTerm && (
          <span className="badge badge-purple">📅 {currentTerm.name}</span>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {[
          { icon: <Users size={22}/>, label: 'Active Students', value: activeStudents,            color: '#a855f7', path: '/admin/students' },
          { icon: <UserCog size={22}/>, label: 'Staff Members', value: staff.length,              color: '#3b82f6', path: '/admin/staff'    },
          { icon: <GraduationCap size={22}/>, label: 'Classes',  value: classes.length,           color: '#22c55e', path: '/admin/academic' },
          { icon: <DollarSign size={22}/>, label: 'Total Revenue', value: totalRevenue > 0 ? `UGX ${totalRevenue.toLocaleString()}` : '—', color: '#f97316', path: '/admin/financials' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color, cursor: 'pointer' }} onClick={() => navigate(s.path)}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
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
          {enrollmentData.length === 0 ? (
            <div className="empty-state"><div className="icon">🏫</div><p>No classes created yet.</p></div>
          ) : (
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
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div><h3>Fee Payment Status</h3><p>Current breakdown</p></div>
            <DollarSign size={16} color="#94a3b8"/>
          </div>
          {payments.length === 0 ? (
            <div className="empty-state"><div className="icon">💰</div><p>No payment records yet.</p></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={paymentStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#f0f4ff' }}/>
                  <Bar dataKey="value" radius={[4,4,0,0]} name="Students">
                    {paymentStatusData.map((entry, i) => (
                      <rect key={i} fill={entry.color}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Heatmap */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div><h3>Attendance Overview</h3><p>School-wide attendance rate — last 5 recorded days</p></div>
          <Activity size={16} color="#94a3b8"/>
        </div>
        {heatmapData.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><p>No attendance data recorded yet.</p></div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {heatmapData.map(day => {
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
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              {[{ label: '≥90% Excellent', color: '#22c55e' }, { label: '75–89% Good', color: '#f59e0b' }, { label: '50–74% Fair', color: '#f97316' }, { label: '<50% Poor', color: '#ef4444' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }}/>
                  {l.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recent Students */}
      <div className="card">
        <div className="card-header">
          <div><h3>Recent Students</h3><p>Latest enrolled students</p></div>
          <button id="btn-view-all-students" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/students')}>View All</button>
        </div>
        {recentStudents.length === 0 ? (
          <div className="empty-state"><div className="icon">🎓</div><p>No students enrolled yet.</p></div>
        ) : (
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
                        {st.photoUrl ? (
                          <div className="avatar"><img src={st.photoUrl} alt="" /></div>
                        ) : (
                          <div className="avatar" style={{ background: '#a855f718', color: '#a855f7' }}>
                            {st.firstName[0]}{st.lastName[0]}
                          </div>
                        )}
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
        )}
      </div>

      {/* Outstanding fees — only show if there are actual payment records */}
      {outstanding > 0 && (
        <div style={{ marginTop: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, color: '#fbbf24', fontSize: 13 }}>Outstanding Fees: </span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {payments.filter(p => p.status !== 'paid').length} students have pending payments totalling <strong style={{ color: '#fbbf24' }}>UGX {outstanding.toLocaleString()}</strong>
          </span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/admin/financials')}>View →</button>
        </div>
      )}
    </div>
  );
}
