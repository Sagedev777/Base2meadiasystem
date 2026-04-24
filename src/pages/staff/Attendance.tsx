import { useState } from 'react';
import { ClipboardCheck, Calendar, Users, CheckCircle } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: '#22c55e', absent: '#ef4444', late: '#f59e0b', excused: '#3b82f6',
};

export default function Attendance() {
  const user = useAuthStore(s => s.user)!;
  const STAFF_LIST = useDataStore(s => s.staff);
  const STUDENTS = useDataStore(s => s.students);
  const CLASSES = useDataStore(s => s.classes);
  const TERMS = useDataStore(s => s.terms);
  const records = useDataStore(s => s.attendance);
  const setRecords = useDataStore(s => s.setAttendance);

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
  const [selClass, setSelClass] = useState(staffProfile.classes[0] ?? 'c1');
  const [selDate, setSelDate] = useState('2025-04-16');
  const [tab, setTab] = useState<'checkin' | 'history'>('checkin');
  const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({});
  const [submitted, setSubmitted] = useState(false);

  const myClasses = CLASSES.filter(c => staffProfile.classes.includes(c.id));
  const studentsInClass = STUDENTS.filter(s => s.classId === selClass);

  // Get existing record for student on selected date
  const getExisting = (studentId: string): AttendanceStatus | null => {
    const rec = records.find(r => r.studentId === studentId && r.classId === selClass && r.date === selDate);
    return rec?.status ?? null;
  };

  const getStatus = (studentId: string): AttendanceStatus =>
    localStatus[studentId] ?? getExisting(studentId) ?? 'present';

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalStatus(prev => ({ ...prev, [studentId]: status }));
    setSubmitted(false);
  };

  const handleSubmit = () => {
    const newRecords: AttendanceRecord[] = studentsInClass.map(st => ({
      id: `att-${selClass}-${selDate}-${st.id}`,
      studentId: st.id,
      studentName: st.fullName,
      classId: selClass,
      date: selDate,
      status: getStatus(st.id),
      checkedBy: staffProfile.fullName,
    }));
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.classId === selClass && r.date === selDate && studentsInClass.find(s => s.id === r.studentId)));
      return [...filtered, ...newRecords];
    });
    setLocalStatus({});
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // History
  const historyRecords = records.filter(r => r.classId === selClass).sort((a, b) => b.date.localeCompare(a.date));
  const uniqueDates = [...new Set(historyRecords.map(r => r.date))].slice(0, 14);

  // Summary stats for today
  const todayRecords = records.filter(r => r.classId === selClass && r.date === selDate);
  const summary = { present: 0, absent: 0, late: 0, excused: 0 };
  todayRecords.forEach(r => { summary[r.status]++; });

  return (
    <div>
      <div className="page-header">
        <div><h2>Attendance Tracking</h2><p>Daily check-in & historical review</p></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'checkin' ? 'active' : ''}`} id="tab-checkin" onClick={() => setTab('checkin')}><ClipboardCheck size={14}/> Daily Check-in</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} id="tab-history" onClick={() => setTab('history')}><Calendar size={14}/> History</button>
      </div>

      {/* Selectors */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Class</label>
            <select id="att-class" className="form-select" value={selClass} onChange={e => { setSelClass(e.target.value); setLocalStatus({}); }}>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={selDate} onChange={e => { setSelDate(e.target.value); setLocalStatus({}); }}/>
          </div>
        </div>
      </div>

      {tab === 'checkin' && (
        <>
          {submitted && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
              <CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }}/>
              Attendance recorded for {studentsInClass.length} students!
            </div>
          )}

          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(s => (
              <div key={s} style={{ padding: '6px 14px', borderRadius: 20, background: `${STATUS_COLOR[s]}18`, border: `1px solid ${STATUS_COLOR[s]}30`, fontSize: 12, fontWeight: 600, color: STATUS_COLOR[s] }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}: {studentsInClass.filter(st => getStatus(st.id) === s).length}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '16px 24px' }}>
              <div><h3>{CLASSES.find(c => c.id === selClass)?.name} — {selDate}</h3><p>{studentsInClass.length} students</p></div>
              <button id="btn-submit-attendance" className="btn btn-staff" onClick={handleSubmit}><ClipboardCheck size={14}/> Submit Attendance</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Student</th><th>Student ID</th><th>Status</th><th>Notes</th></tr></thead>
                <tbody>
                  {studentsInClass.map((st, idx) => {
                    const status = getStatus(st.id);
                    return (
                      <tr key={st.id}>
                        <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {st.photoUrl ? (
                              <img src={st.photoUrl} className="avatar" style={{ objectFit: 'cover', border: `2px solid ${STATUS_COLOR[status]}30` }} alt="" />
                            ) : (
                              <div className="avatar" style={{ background: `${STATUS_COLOR[status]}18`, color: STATUS_COLOR[status] }}>{st.firstName[0]}{st.lastName[0]}</div>
                            )}
                            <span style={{ fontWeight: 600 }}>{st.fullName}</span>
                          </div>
                        </td>
                        <td className="td-muted">{st.studentId}</td>
                        <td>
                          <select
                            id={`att-status-${st.id}`}
                            className="status-select"
                            style={{ borderColor: STATUS_COLOR[status], color: STATUS_COLOR[status] }}
                            value={status}
                            onChange={e => handleStatusChange(st.id, e.target.value as AttendanceStatus)}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </td>
                        <td>
                          {status === 'absent' && <span style={{ fontSize: 11, color: '#ef4444' }}>⚠ Parent will be notified</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 24px' }}>
            <div><h3>Attendance History</h3><p>Last 14 days · {CLASSES.find(c => c.id === selClass)?.name}</p></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  {uniqueDates.map(d => <th key={d} style={{ fontSize: 10 }}>{d.slice(5)}</th>)}
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {studentsInClass.map(st => {
                  const studentRecs = historyRecords.filter(r => r.studentId === st.id);
                  const pct = studentRecs.length ? Math.round((studentRecs.filter(r => r.status === 'present' || r.status === 'late').length / studentRecs.length) * 100) : 0;
                  return (
                    <tr key={st.id}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{st.fullName}</td>
                      {uniqueDates.map(d => {
                        const rec = studentRecs.find(r => r.date === d);
                        const col = rec ? STATUS_COLOR[rec.status] : '#1e2d45';
                        const sym = rec ? { present: '✓', absent: '✗', late: '~', excused: 'E' }[rec.status] : '—';
                        return (
                          <td key={d} style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 4, background: `${col}22`, color: col, fontSize: 11, fontWeight: 700, lineHeight: '22px', textAlign: 'center' }}>{sym}</span>
                          </td>
                        );
                      })}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-wrap" style={{ width: 60 }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444' }}/>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 12, color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
