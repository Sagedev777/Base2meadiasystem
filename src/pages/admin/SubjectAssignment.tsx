import { useState, useEffect } from 'react';
import { BookOpen, Plus, Check, X } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';

export default function SubjectAssignment() {
  const TERMS = useDataStore(s => s.terms);
  const CLASSES = useDataStore(s => s.classes);
  const SUBJECTS = useDataStore(s => s.courses);
  const STAFF_LIST = useDataStore(s => s.staff);
  const assignments = useDataStore(s => s.assignments);
  const { addAssignment, removeAssignment, fetchFromBackend } = useDataStore();

  const currentTerm = TERMS.find(t => t.isCurrent) || TERMS[0];
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staffId: '', subjectId: '', classId: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchFromBackend();
  }, []);

  if (!currentTerm) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No active academic term found. Please configure terms in Academic Setup.</div>;
  }

  const handleAdd = async () => {
    if (!form.staffId || !form.subjectId || !form.classId) return;
    setLoading(true);
    try {
      await addAssignment({
        staffId: form.staffId,
        subjectId: form.subjectId,
        classId: form.classId,
        termId: currentTerm.id,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setForm({ staffId: '', subjectId: '', classId: '' });
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await removeAssignment(id);
    } catch (e) {
      console.error(e);
    }
  };

  const getStaff = (id: string) => STAFF_LIST.find(s => s.id === id);
  const getSubject = (id: string) => SUBJECTS.find(s => s.id === id);
  const getClass = (id: string) => CLASSES.find(c => c.id === id);

  // Group by staff member
  const grouped = STAFF_LIST.map(staff => ({
    staff,
    staffAssignments: assignments.filter(a => a.staffId === staff.id),
  })).filter(g => g.staffAssignments.length > 0);

  return (
    <div>
      <div className="page-header">
        <div><h2>Subject Assignments</h2><p>Assign subjects to teachers per class · {currentTerm.name}</p></div>
        <button id="btn-new-assignment" className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={14}/> New Assignment
        </button>
      </div>

      {saved && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
          <Check size={14} style={{ display: 'inline', marginRight: 6 }}/>Assignment saved successfully!
        </div>
      )}

      {/* Assignment Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>New Subject Assignment</h3>
            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Teacher</label>
              <select id="assign-staff" className="form-select" value={form.staffId} onChange={e => setForm(p => ({...p, staffId: e.target.value}))}>
                <option value="">Select teacher…</option>
                {STAFF_LIST.map(s => <option key={s.id} value={s.id}>{s.fullName} — {s.department}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Subject</label>
              <select id="assign-subject" className="form-select" value={form.subjectId} onChange={e => setForm(p => ({...p, subjectId: e.target.value}))}>
                <option value="">Select subject…</option>
                {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Class</label>
              <select id="assign-class" className="form-select" value={form.classId} onChange={e => setForm(p => ({...p, classId: e.target.value}))}>
                <option value="">Select class…</option>
                {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button id="btn-confirm-assign" className="btn btn-primary" style={{ marginBottom: 0 }} onClick={handleAdd} disabled={loading}>
              <Check size={14}/> {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {/* Assignments grouped by teacher */}
      {grouped.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(({ staff, staffAssignments }) => (
            <div className="card" key={staff.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                {staff.photoUrl ? (
                  <div className="avatar avatar-lg"><img src={staff.photoUrl} alt="" /></div>
                ) : (
                  <div className="avatar avatar-lg" style={{ background: '#3b82f618', color: '#3b82f6' }}>
                    {staff.firstName[0]}{staff.lastName[0]}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{staff.fullName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{staff.department} · {staff.staffId}</div>
                </div>
                <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{staffAssignments.length} subject{staffAssignments.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {staffAssignments.map(a => {
                  const subject = getSubject(a.subjectId);
                  const cls = getClass(a.classId);
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={14} color="#3b82f6"/>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{subject?.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{subject?.code}</div>
                        </div>
                      </div>
                      <span className="badge badge-muted">{cls?.name}</span>
                      <button
                        id={`remove-assign-${a.id}`}
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(a.id)}
                        style={{ padding: '4px 10px' }}
                      >
                        <X size={12}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon"><BookOpen size={48} style={{ opacity: 0.2 }}/></div>
          <p>No subject assignments yet. Click <strong>New Assignment</strong> to begin.</p>
        </div>
      )}

      {/* Full matrix table */}
      <div className="card" style={{ marginTop: 24, padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 24px' }}>
          <div><h3>Assignment Matrix</h3><p>All assignments at a glance · {currentTerm.name}</p></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Teacher</th><th>Subject</th><th>Code</th><th>Class</th><th>Term</th><th>Action</th></tr></thead>
            <tbody>
              {assignments.map(a => {
                const staff = getStaff(a.staffId);
                const subject = getSubject(a.subjectId);
                const cls = getClass(a.classId);
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {staff?.photoUrl ? (
                          <div className="avatar" style={{ width: 28, height: 28 }}><img src={staff.photoUrl} alt="" /></div>
                        ) : (
                          <div className="avatar" style={{ background: '#3b82f618', color: '#3b82f6', width: 28, height: 28, fontSize: 11 }}>{staff?.firstName[0]}{staff?.lastName[0]}</div>
                        )}
                        <span style={{ fontWeight: 600 }}>{staff?.fullName}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{subject?.name}</td>
                    <td><span className="badge badge-info">{subject?.code}</span></td>
                    <td className="td-muted">{cls?.name}</td>
                    <td className="td-muted">{currentTerm.name}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" id={`matrix-remove-${a.id}`} onClick={() => handleRemove(a.id)}>
                        <X size={12}/> Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {assignments.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state" style={{ padding: 24 }}><p>No assignments</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
