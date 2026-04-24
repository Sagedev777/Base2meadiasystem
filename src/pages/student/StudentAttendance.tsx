import { computeAttendanceSummary } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { ClipboardCheck } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  present: '#22c55e', absent: '#ef4444', late: '#f59e0b', excused: '#3b82f6',
};
const STATUS_SYM: Record<string, string> = { present: '✓', absent: '✗', late: '~', excused: 'E' };

export default function StudentAttendance() {
  const STUDENTS = useDataStore(s => s.students);
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
  const att = computeAttendanceSummary(STUDENTS, ATTENDANCE, student.id);

  const myRecords = ATTENDANCE
    .filter(r => r.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const uniqueDates = [...new Set(myRecords.map(r => r.date))];

  return (
    <div>
      <div className="page-header">
        <div><h2>My Attendance</h2><p>{currentTerm.name} · {student.className}</p></div>
        <span className={`badge ${att.percentage >= 80 ? 'badge-success' : 'badge-danger'}`} style={{ padding: '8px 16px', fontSize: 13 }}>
          <ClipboardCheck size={13} /> {att.percentage}% Attendance Rate
        </span>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Days Present', val: att.present, color: '#22c55e' },
          { label: 'Days Late', val: att.late, color: '#f59e0b' },
          { label: 'Days Absent', val: att.absent, color: '#ef4444' },
          { label: 'Excused', val: att.excused, color: '#3b82f6' },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ borderTopColor: s.color }}>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color, fontSize: 32 }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><div><h3>Attendance Rate</h3><p>Overall this term</p></div><span style={{ fontWeight: 900, fontSize: 22, color: att.percentage >= 80 ? '#22c55e' : '#ef4444' }}>{att.percentage}%</span></div>
        <div className="progress-bar-wrap" style={{ height: 12, marginBottom: 10 }}>
          <div className="progress-bar-fill" style={{ width: `${att.percentage}%`, background: att.percentage >= 80 ? '#22c55e' : att.percentage >= 60 ? '#f59e0b' : '#ef4444' }} />
        </div>
        {att.percentage < 80 && (
          <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>
            ⚠ Your attendance is below the required 80% threshold. Please speak to your teacher.
          </div>
        )}
      </div>

      {/* Calendar-style grid */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 24px' }}>
          <div><h3>Attendance History</h3><p>{myRecords.length} records · {currentTerm.name}</p></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Status</th><th>Marked By</th><th>Notes</th></tr></thead>
            <tbody>
              {myRecords.map(r => {
                const color = STATUS_COLOR[r.status];
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.date}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, color, fontSize: 12, fontWeight: 700 }}>
                        {STATUS_SYM[r.status]} {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="td-muted">{r.checkedBy ?? '—'}</td>
                    <td className="td-muted">{r.status === 'absent' ? '⚠ Parent notified' : '—'}</td>
                  </tr>
                );
              })}
              {myRecords.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#4b6080', padding: 40 }}>No attendance records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
