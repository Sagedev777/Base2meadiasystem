import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, UserMinus, UserCheck, Phone, Mail, MapPin, Calendar, CreditCard, Users, Eye } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { Student } from '../../types';
import { COURSES } from '../../data/mockData';

type FormData = Omit<Student, 'id' | 'fullName' | 'studentId' | 'status' | 'totalFee'> & { totalFee: string; initialPayment: string };

const emptyForm: FormData = {
  firstName: '', lastName: '', email: '', phone: '', address: '', gender: 'Male',
  dateOfBirth: '', classId: '', className: '', enrolledCourseIds: [], enrollmentDate: new Date().toISOString().split('T')[0],
  photoUrl: '', parentName1: '', parentPhone1: '', parentName2: '', parentPhone2: '',
  totalFee: '', initialPayment: ''
};

export default function Students() {
  const list = useDataStore(s => s.students);
  const { addStudent, updateStudent, deleteStudent, updateStudentStatus, fetchFromBackend } = useDataStore();
  
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  const handleWithdraw = async () => {
    if (!withdrawId) return;
    try {
      await updateStudentStatus(withdrawId, 'withdrawn');
      setWithdrawId(null);
    } catch (err: any) { alert(err.message); }
  };

  useEffect(() => {
    fetchFromBackend();
  }, []);

  const filtered = list.filter(s => {
    const matchesSearch = (s.fullName + s.studentId + (s.email || '')).toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'all' || s.className === filterClass;
    return matchesSearch && matchesClass;
  });

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      firstName: s.firstName, lastName: s.lastName,
      dateOfBirth: s.dateOfBirth || '', gender: s.gender, classId: s.classId || '',
      className: s.className || '', enrolledCourseIds: s.enrolledCourseIds ?? [],
      enrollmentDate: s.enrollmentDate, email: s.email || '',
      phone: s.phone || '', address: s.address || '', photoUrl: s.photoUrl ?? '',
      parentName1: s.parentName1 ?? '', parentPhone1: s.parentPhone1 ?? '',
      parentName2: s.parentName2 ?? '', parentPhone2: s.parentPhone2 ?? '',
      totalFee: s.totalFee?.toString() || '',
      initialPayment: ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || form.enrolledCourseIds.length === 0) {
      alert('Please provide First Name, Last Name, and select at least 1 Course.');
      return;
    }
    if (editing) {
      try {
        await updateStudent(editing.id, {
          ...form,
          totalFee: form.totalFee ? parseFloat(form.totalFee) : undefined,
        });
        setShowModal(false);
      } catch (err: any) { alert(err.message); }
    } else {
      try {
        await addStudent({
          ...form,
          password: 'student123',
          totalFee: form.totalFee ? parseFloat(form.totalFee) : undefined,
          initialPayment: form.initialPayment ? parseFloat(form.initialPayment) : undefined,
        });
        setShowModal(false);
      } catch (err: any) { alert(err.message); }
    }
  };

  const f = (k: keyof FormData, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const counts = { active: list.filter(s => s.status === 'active').length, withdrawn: list.filter(s => s.status === 'withdrawn').length, graduated: list.filter(s => s.status === 'graduated').length };
  const categories = Array.from(new Set(COURSES.map(c => c.department))).filter(Boolean) as string[];

  return (
    <div>
      <div className="page-header">
        <div><h2>Student Directory</h2><p>Manage student registrations, profiles, and statuses.</p></div>
        <button id="btn-enroll-student" className="btn btn-primary" onClick={openAdd}>
          <Plus size={15}/> Register Student
        </button>
      </div>

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
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={15} color="#64748b"/>
          <input placeholder="Search by name, ID or email…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{ width: 200 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="all">All Classes</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Full Name</th><th>Student ID</th><th>Class</th><th>Enrolled Courses</th><th>Parent/Guardian</th><th>Money Agreed</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">
                        {s.photoUrl ? <img src={s.photoUrl} alt="" /> : s.firstName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.fullName}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{s.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td><code style={{ fontSize: 12, background: '#1e2d45', padding: '2px 8px', borderRadius: 4 }}>{s.studentId}</code></td>
                  <td><span className="badge badge-info">{s.className}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                      {s.enrolledCourseIds.map(id => {
                        const course = COURSES.find(c => c.id === id);
                        return <span key={id} className="badge badge-muted" style={{ fontSize: 9 }}>{course?.name || id}</span>;
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{s.parentName1 || '—'}</div>
                      <div style={{ color: '#64748b' }}>{s.parentPhone1 || '—'}</div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#f97316' }}>
                    {s.totalFee ? `UGX ${s.totalFee.toLocaleString()}` : '—'}
                  </td>
                  <td><span className={`badge ${s.status === 'active' ? 'badge-success' : s.status === 'withdrawn' ? 'badge-danger' : 'badge-purple'}`}>{s.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewing(s)} title="View Student"><Eye size={12}/></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} title="Edit Student"><Edit2 size={12}/></button>
                      {s.status === 'active' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => setWithdrawId(s.id)}><UserMinus size={12}/></button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => updateStudentStatus(s.id, 'active')}><UserCheck size={12}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Student Profile' : 'New Student Registration'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 20, marginBottom: 24, padding: 16, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div className="avatar avatar-xl" style={{ position: 'relative' }}>
                  {form.photoUrl ? <img src={form.photoUrl} alt="Profile" /> : <Users size={32}/>}
                  <label style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--primary)', color: 'white', padding: 4, borderRadius: '50%', cursor: 'pointer' }}>
                    <Plus size={12}/>
                    <input type="file" hidden accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => f('photoUrl', ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}/>
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.firstName} onChange={e => f('firstName', e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} onChange={e => f('lastName', e.target.value)}/></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Agreed Fee (UGX)</label>
                      <input type="number" className="form-input" style={{ color: '#f97316', fontWeight: 700 }} value={form.totalFee} onChange={e => f('totalFee', e.target.value)} placeholder="e.g. 1500000"/>
                    </div>
                    {!editing && (
                      <div className="form-group">
                        <label className="form-label">Initial Payment (UGX)</label>
                        <input type="number" className="form-input" style={{ color: '#22c55e', fontWeight: 700 }} value={form.initialPayment} onChange={e => f('initialPayment', e.target.value)} placeholder="e.g. 500000"/>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Classes (Select up to 2)</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
                    {categories.map(cat => (
                      <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, background: form.className.includes(cat) ? 'var(--primary-light)' : 'var(--bg-surface)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.className.includes(cat)} onChange={e => {
                          const current = form.className.split(', ').filter(Boolean);
                          let next;
                          if (e.target.checked) {
                            if (current.length >= 2) return;
                            next = [...current, cat];
                          } else {
                            next = current.filter(c => c !== cat);
                          }
                          f('className', next.join(', '));
                          f('classId', next[0] || ''); // Keep first for backward compatibility
                        }}/>
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Enrolled Courses</label>
                <div className="course-selector-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 10, background: 'var(--bg-surface)', borderRadius: 8 }}>
                  {COURSES.filter(c => form.className.includes(c.department)).map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <input type="checkbox" checked={form.enrolledCourseIds.includes(c.id)} onChange={e => {
                        const next = e.target.checked ? [...form.enrolledCourseIds, c.id] : form.enrolledCourseIds.filter(id => id !== c.id);
                        f('enrolledCourseIds', next);
                      }}/>
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group"><label className="form-label">Parent 1 Name</label><input className="form-input" value={form.parentName1} onChange={e => f('parentName1', e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Parent 1 Phone</label><input className="form-input" value={form.parentPhone1} onChange={e => f('parentPhone1', e.target.value)}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Parent 2 Name (Optional)</label><input className="form-input" value={form.parentName2} onChange={e => f('parentName2', e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Parent 2 Phone</label><input className="form-input" value={form.parentPhone2} onChange={e => f('parentPhone2', e.target.value)}/></div>
              </div>

              <div className="form-row">
                <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={e => f('gender', e.target.value as any)}><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => f('phone', e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Email (Optional)</label><input className="form-input" value={form.email} onChange={e => f('email', e.target.value)}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="btn-save-student" className="btn btn-primary" onClick={handleSave}>{editing ? 'Update Student' : 'Register Student'}</button>
            </div>
          </div>
        </div>
      )}

      {withdrawId && (
        <div className="modal-overlay" onClick={() => setWithdrawId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Withdraw Student</h3><button className="modal-close" onClick={() => setWithdrawId(null)}>✕</button></div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>Are you sure you want to withdraw this student? This will change their status to <strong>Withdrawn</strong>.</p>
              <textarea className="form-input" style={{ height: 80 }} placeholder="Reason for withdrawal (optional)…" value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)}/>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setWithdrawId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleWithdraw}>Withdraw Student</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Profile</h3>
              <button className="modal-close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div className="avatar avatar-xl" style={{ margin: '0 auto', marginBottom: 12 }}>
                    {viewing.photoUrl ? <img src={viewing.photoUrl} alt="Profile" /> : <Users size={32}/>}
                  </div>
                  <h4 style={{ margin: 0, fontSize: 18 }}>{viewing.fullName}</h4>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{viewing.studentId}</p>
                  <span className={`badge ${viewing.status === 'active' ? 'badge-success' : viewing.status === 'withdrawn' ? 'badge-danger' : 'badge-purple'}`} style={{ marginTop: 8 }}>{viewing.status}</span>
                </div>
                
                <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ marginBottom: 12 }}><div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Gender & DOB</div><div>{viewing.gender || '—'} • {viewing.dateOfBirth || '—'}</div></div>
                  <div style={{ marginBottom: 12 }}><div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Contact</div><div style={{ display: 'flex', alignItems: 'center' }}><Phone size={12} style={{ marginRight: 4 }}/>{viewing.phone || '—'}</div><div style={{ marginTop: 4, display: 'flex', alignItems: 'center' }}><Mail size={12} style={{ marginRight: 4 }}/>{viewing.email || '—'}</div></div>
                  <div><div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Address</div><div style={{ display: 'flex', alignItems: 'center' }}><MapPin size={12} style={{ marginRight: 4 }}/>{viewing.address || '—'}</div></div>
                </div>
              </div>

              <div>
                <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Academic Details</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                    <div><div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Class/Department</div><div style={{ fontWeight: 600 }}>{viewing.className || '—'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Enrollment Date</div><div>{viewing.enrollmentDate || '—'}</div></div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>Enrolled Courses</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {viewing.enrolledCourseIds?.length ? viewing.enrolledCourseIds.map(id => {
                          const course = COURSES.find(c => c.id === id);
                          return <span key={id} className="badge badge-muted">{course?.name || id}</span>;
                        }) : <span style={{ color: '#94a3b8' }}>No courses assigned</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Parent/Guardian Details</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                    <div><div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Primary Guardian</div><div style={{ fontWeight: 600 }}>{viewing.parentName1 || '—'}</div><div>{viewing.parentPhone1}</div></div>
                    {viewing.parentName2 && <div><div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Secondary Guardian</div><div style={{ fontWeight: 600 }}>{viewing.parentName2}</div><div>{viewing.parentPhone2}</div></div>}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Financial Details</h5>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Agreed Total Fee</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>{viewing.totalFee ? `UGX ${viewing.totalFee.toLocaleString()}` : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
