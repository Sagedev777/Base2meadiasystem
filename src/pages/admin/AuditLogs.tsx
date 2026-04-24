import { useState } from 'react';
import { Shield, Clock, User, Filter, Search } from 'lucide-react';

interface AuditEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
  ip: string;
  time: string;
}

const DEMO_LOGS: AuditEntry[] = [
  { id: 'a1',  user: 'Dr. Samuel Osei',  role: 'admin',   action: 'ENROLL',   module: 'Students',    details: 'Enrolled Kwame Asante (B2MA-2024-001)',   ip: '192.168.1.10', time: '2025-04-16 08:32:14' },
  { id: 'a2',  user: 'Mrs. Abena Mensah', role: 'staff',  action: 'GRADE',    module: 'Grades',      details: 'Recorded score 85 for Kwame Asante — MPF101', ip: '192.168.1.15', time: '2025-04-16 09:12:05' },
  { id: 'a3',  user: 'Dr. Samuel Osei',  role: 'admin',   action: 'PAYMENT',  module: 'Financials',  details: 'Marked UGX 800 as paid for Kwame Asante',   ip: '192.168.1.10', time: '2025-04-16 10:01:48' },
  { id: 'a4',  user: 'Mrs. Abena Mensah', role: 'staff',  action: 'ATTEND',   module: 'Attendance',  details: 'Submitted attendance for Diploma Media Yr 1 — 2025-04-16', ip: '192.168.1.15', time: '2025-04-16 08:05:30' },
  { id: 'a5',  user: 'Dr. Samuel Osei',  role: 'admin',   action: 'EDIT',     module: 'Staff',       details: 'Updated profile for Mrs. Abena Mensah',     ip: '192.168.1.10', time: '2025-04-15 14:22:17' },
  { id: 'a6',  user: 'Dr. Samuel Osei',  role: 'admin',   action: 'LOGIN',    module: 'Auth',        details: 'Successful login',                          ip: '192.168.1.10', time: '2025-04-15 08:00:01' },
  { id: 'a7',  user: 'Mrs. Abena Mensah', role: 'staff',  action: 'LOGIN',    module: 'Auth',        details: 'Successful login',                          ip: '192.168.1.15', time: '2025-04-15 08:01:34' },
  { id: 'a8',  user: 'Unknown',          role: 'admin',   action: 'LOGIN_FAIL', module: 'Auth',      details: 'Failed login attempt — invalid password',   ip: '41.66.200.12', time: '2025-04-14 23:14:55' },
  { id: 'a9',  user: 'Dr. Samuel Osei',  role: 'admin',   action: 'CREATE',   module: 'Classes',     details: 'Created class: Certificate in Photography 2', ip: '192.168.1.10', time: '2025-04-14 11:05:00' },
  { id: 'a10', user: 'Dr. Samuel Osei',  role: 'admin',   action: 'CREATE',   module: 'Subjects',    details: 'Created subject: Social Media Marketing (SMM401)', ip: '192.168.1.10', time: '2025-04-13 09:30:22' },
];

const ACTION_COLOR: Record<string, string> = {
  ENROLL: '#22c55e', GRADE: '#3b82f6', PAYMENT: '#f97316', ATTEND: '#a855f7',
  EDIT: '#f59e0b', LOGIN: '#64748b', LOGIN_FAIL: '#ef4444', CREATE: '#22c55e', DELETE: '#ef4444',
};

export default function AuditLogs() {
  const [logs]       = useState<AuditEntry[]>(DEMO_LOGS);
  const [search, setSearch]     = useState('');
  const [filterAction, setFilter] = useState('');

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.module.toLowerCase().includes(q);
    const matchA = !filterAction || l.action === filterAction;
    return matchQ && matchA;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div>
      <div className="page-header">
        <div><h2>Audit Logs</h2><p>Full trail of all system actions</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 10 }}>
          <Shield size={14} color="#a855f7"/>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#a855f7' }}>{logs.length} total entries</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={15} color="#64748b"/>
          <input id="audit-search" placeholder="Search user, action, module…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select id="audit-filter-action" className="form-select" style={{ width: 'auto' }} value={filterAction} onChange={e => setFilter(e.target.value)}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="td-muted" style={{ fontSize: 12 }}>{filtered.length} records</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Details</th><th>IP Address</th></tr></thead>
            <tbody>
              {filtered.map(log => {
                const color = ACTION_COLOR[log.action] ?? '#64748b';
                return (
                  <tr key={log.id} style={log.action === 'LOGIN_FAIL' ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color="#4b6080"/>
                        <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{log.time}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, background: log.role === 'admin' ? '#a855f718' : '#3b82f618', color: log.role === 'admin' ? '#a855f7' : '#3b82f6' }}>
                          {log.user.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{log.user}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>{log.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: `${color}18`, color, fontSize: 11, fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="td-muted">{log.module}</td>
                    <td style={{ fontSize: 12, maxWidth: 280 }}>{log.details}</td>
                    <td>
                      <code style={{ fontSize: 11, color: log.action === 'LOGIN_FAIL' ? '#f87171' : '#64748b', background: '#1e2d45', padding: '2px 6px', borderRadius: 4 }}>{log.ip}</code>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="icon">🔍</div><p>No audit records found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
