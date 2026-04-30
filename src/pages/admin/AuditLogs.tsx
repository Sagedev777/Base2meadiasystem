import { useState, useEffect } from 'react';
import { Shield, Clock, User, Filter, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface AuditEntry {
  id:        string;
  userName:  string | null;
  userRole:  string | null;
  action:    string;
  module:    string;
  details:   string;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: '#22c55e', UPDATE: '#3b82f6', PATCH: '#f59e0b',
  DELETE: '#ef4444', LOGIN:  '#64748b', LOGIN_FAIL: '#ef4444',
};

export default function AuditLogs() {
  const token = useAuthStore(s => s.token);
  const [logs, setLogs]           = useState<AuditEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterAction, setFilter] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('http://localhost:4000/api/audit', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setLogs(data.data ?? []);
      } catch {
        setError('Could not load audit logs. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [token]);

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    const q       = search.toLowerCase();
    const matchQ  = !q || (l.userName ?? '').toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.module.toLowerCase().includes(q);
    const matchA  = !filterAction || l.action === filterAction;
    return matchQ && matchA;
  });

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
        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><p>Loading audit logs…</p></div>
        ) : error ? (
          <div className="empty-state"><div className="icon">⚠️</div><p style={{ color: '#f87171' }}>{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">🔍</div><p>{logs.length === 0 ? 'No audit records yet. Actions you take will appear here.' : 'No records match your search.'}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Details</th><th>IP Address</th></tr></thead>
              <tbody>
                {filtered.map(log => {
                  const color = ACTION_COLOR[log.action] ?? '#64748b';
                  const time  = new Date(log.createdAt).toLocaleString();
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} color="#4b6080"/>
                          <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{time}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, background: log.userRole === 'admin' ? '#a855f718' : '#3b82f618', color: log.userRole === 'admin' ? '#a855f7' : '#3b82f6' }}>
                            {(log.userName ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{log.userName ?? 'Unknown'}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{log.userRole ?? ''}</div>
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
                        <code style={{ fontSize: 11, color: '#64748b', background: '#1e2d45', padding: '2px 6px', borderRadius: 4 }}>
                          {log.ipAddress ?? '—'}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
