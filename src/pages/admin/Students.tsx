import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Download, UserX, UserCheck } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { Student } from '../../types';

type FormData = Omit<Student, 'id' | 'fullName'> & { photoUrl?: string };

const emptyForm: FormData = {
  studentId: '', firstName: '', lastName: '', dateOfBirth: '', gender: 'Male',
  classId: 'k1', className: 'Jan 2025 Intake', enrolledCourseIds: [],
  enrollmentDate: new Date().toISOString().slice(0, 10),
  status: 'active', email: '', phone: '', address: '', photoUrl: '',
};

/** Export list to CSV */
function exportCSV(students: Student[]) {
  const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Class', 'Gender', 'Phone', 'Status', 'Enrolled'];
  const rows = students.map(s => [
    s.studentId, s.firstName, s.lastName, s.email, s.className, s.gender, s.phone, s.status, s.enrollmentDate,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'students_export.csv' });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Students() {
  const list = useDataStore(s => s.students);
  const setList = useDataStore(s => s.setStudents);
  const CLASSES = useDataStore(s => s.classes);
  const COURSES = useDataStore(s => s.courses);
  const [search, setSearch]         = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Student | null>(null);
  const [form, setForm]             = useState<FormData>(emptyForm);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  const filtered = list.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchC = !filterClass || s.classId === filterClass;
    const matchS = !filterStatus || s.status === filterStatus;
    return matchQ && matchC && matchS;
  });

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ studentId: s.studentId, firstName: s.firstName, lastName: s.lastName, dateOfBirth: s.dateOfBirth, gender: s.gender, classId: s.classId, className: s.className, enrolledCourseIds: s.enrolledCourseIds ?? [], enrollmentDate: s.enrollmentDate, status: s.status, email: s.email, phone: s.phone, address: s.address, photoUrl: s.photoUrl ?? '' });
    setShowModal(true);
  };
  const handleDelete = (id: string) => { if (window.confirm('Permanently delete this student record?')) setList(l => l.filter(s => s.id !== id)); };
  const handleWithdraw = () => {
    if (!withdrawId) return;
    setList(l => l.map(s => s.id === withdrawId ? { ...s, status: 'withdrawn' } : s));
    setWithdrawId(null); setWithdrawReason('');
  };
  const handleReactivate = (id: string) => {
    setList(l => l.map(s => s.id === id ? { ...s, status: 'active' } : s));
  };

  const handleSave = () => {
    const fullName = `${form.firstName} ${form.lastName}`;
    const cls = CLASSES.find(c => c.id === form.classId);
    const className = cls?.name ?? form.className;
    if (editing) {
      setList(l => l.map(s => s.id === editing.id ? { ...s, ...form, fullName, className } : s));
    } else {
      const newId = `st${Date.now()}`;
      const newSId = form.studentId || `B2MA-2025-${String(list.length + 1).padStart(3, '0')}`;
      setList(l => [...l, { id: newId, ...form, studentId: newSId, fullName, className }]);
    }
    setShowModal(false);
  };

  const f = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const counts = { active: list.filter(s => s.status === 'active').length, withdrawn: list.filter(s => s.status === 'withdrawn').length, graduated: list.filter(s => s.status === 'graduated').length };

  return (
    <div>
      <div className="page-header">
        <div><h2>Students</h2><p>Manage all student enrollments and profiles</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button id="btn-export-csv" className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered)}>
            <Download size={14}/> Export CSV
          </button>
          <button id="btn-add-student" className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Enroll Student</button>
        </div>
      </div>

      {/* Quick stat pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { label: 'Active', count: counts.active, color: '#22c55e' },
          { label: 'Withdrawn', count: counts.withdrawn, color: '#ef4444' },
          { label: 'Graduated', count: counts.graduated, color: '#a855f7' },
        ].map(p => (
          <div key={p.label} style={{ padding: '6px 14px', borderRadius: 20, background: `${p.color}12`, border: `1px solid ${p.color}30`, fontSize: 12, fontWeight: 600, color: p.color }}>
            {p.label}: {p.count}
          </div>
        ))}
        <span className="td-muted" style={{ marginLeft: 'auto', fontSize: 12, alignSelf: 'center' }}>Total: {list.length}</span>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={15} color="#64748b"/>
          <input id="search-students" placeholder="Search by name, ID or email…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select id="filter-class" className="form-select" style={{ width: 'auto' }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select id="filter-status" className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="graduated">Graduated</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="td-muted" style={{ fontSize: 12 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Student</th><th>Student ID</th><th>Class</th><th>Gender</th><th>Phone</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ opacity: s.status === 'withdrawn' ? 0.65 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s.photoUrl ? (
                        <img src={s.photoUrl} className="avatar" style={{ objectFit: 'cover' }} alt="" />
                      ) : (
                        <div className="avatar" style={{ background: '#a855f718', color: '#a855f7' }}>{s.firstName[0]}{s.lastName[0]}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                        <div className="td-muted">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><code style={{ fontSize: 12, background: '#1e2d45', padding: '2px 8px', borderRadius: 4 }}>{s.studentId}</code></td>
                  <td><span className="badge badge-info">{s.className}</span></td>
                  <td className="td-muted">{s.gender}</td>
                  <td className="td-muted">{s.phone}</td>
                  <td><span className={`badge ${s.status === 'active' ? 'badge-success' : s.status === 'withdrawn' ? 'badge-danger' : s.status === 'graduated' ? 'badge-purple' : 'badge-muted'}`}>{s.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" id={`edit-${s.id}`} onClick={() => openEdit(s)} title="Edit"><Edit2 size={13}/></button>
                      {s.status === 'active'
                        ? <button className="btn btn-danger btn-sm" id={`withdraw-${s.id}`} onClick={() => setWithdrawId(s.id)} title="Withdraw"><UserX size={13}/></button>
                        : s.status === 'withdrawn'
                          ? <button className="btn btn-ghost btn-sm" id={`reactivate-${s.id}`} onClick={() => handleReactivate(s.id)} title="Reactivate"><UserCheck size={13}/></button>
                          : null
                      }
                      <button className="btn btn-danger btn-sm" id={`del-${s.id}`} onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">🎓</div><p>No students found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Student' : 'Enroll New Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Photo Upload Section */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-surface)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#94a3b8' }}>
                    {form.firstName ? form.firstName[0] : '?'}
                  </div>
                )}
                <div>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    <Plus size={14} /> Upload Passport Photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setForm(p => ({ ...p, photoUrl: ev.target?.result as string }));
                        reader.readAsDataURL(file);
                      }
                    }}/>
                  </label>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>JPEG or PNG. Max 2MB.</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.firstName} onChange={e => f('firstName', e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} onChange={e => f('lastName', e.target.value)}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => f('gender', e.target.value)}><option>Male</option><option>Female</option></select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Intake Cohort</label>
                  <select className="form-select" value={form.classId} onChange={e => f('classId', e.target.value)}>
                    {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => f('status', e.target.value as Student['status'])}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                    <option value="withdrawn">Withdrawn</option><option value="graduated">Graduated</option>
                  </select>
                </div>
              </div>
              {/* Course Enrollment */}
              <div className="form-group">
                <label className="form-label">Enrolled Course(s) <span style={{color:'#64748b',fontWeight:400}}>(select 1 or 2)</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', maxHeight: 200, overflowY: 'auto', padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {COURSES.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={form.enrolledCourseIds.includes(c.id)}
                        onChange={ev => {
                          const sel = form.enrolledCourseIds;
                          if (ev.target.checked) {
                            if (sel.length >= 2) return; // max 2 courses
                            setForm(p => ({ ...p, enrolledCourseIds: [...sel, c.id] }));
                          } else {
                            setForm(p => ({ ...p, enrolledCourseIds: sel.filter(id => id !== c.id) }));
                          }
                        }}
                        disabled={!form.enrolledCourseIds.includes(c.id) && form.enrolledCourseIds.length >= 2}
                      />
                      <span><strong>{c.code}</strong> — {c.name}</span>
                    </label>
                  ))}
                </div>
                {form.enrolledCourseIds.length === 0 && <div style={{fontSize:11,color:'#ef4444',marginTop:4}}>⚠ Please select at least one course</div>}
              </div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => f('email', e.target.value)}/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => f('phone', e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Enrollment Date</label><input type="date" className="form-input" value={form.enrollmentDate} onChange={e => f('enrollmentDate', e.target.value)}/></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => f('address', e.target.value)}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="btn-save-student" className="btn btn-primary" onClick={handleSave}>{editing ? 'Save Changes' : 'Enroll Student'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {withdrawId && (
        <div className="modal-overlay" onClick={() => setWithdrawId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Withdraw Student</h3>
              <button className="modal-close" onClick={() => setWithdrawId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
                ⚠ This will mark the student as withdrawn. Their records will be preserved.
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Withdrawal (optional)</label>
                <textarea className="form-input" style={{ resize: 'vertical', minHeight: 80 }} placeholder="e.g. Financial difficulties, transfer to another school…" value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setWithdrawId(null)}>Cancel</button>
              <button id="btn-confirm-withdraw" className="btn btn-danger" onClick={handleWithdraw}><UserX size={14}/> Confirm Withdrawal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
