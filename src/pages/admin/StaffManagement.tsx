import { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Staff } from '../../types';
import { UserCog, Mail, Phone, Plus, UserX, UserCheck, Edit2, X, Save } from 'lucide-react';

type StaffMember = Staff & { isActive?: boolean };

export default function StaffManagement() {
  const baseStaff = useDataStore(s => s.staff);
  const setBaseStaff = useDataStore(s => s.setStaff);
  const [staff, setStaff] = useState<StaffMember[]>(baseStaff.map(s => ({ ...s, isActive: true })));

  const saveToStore = (newStaff: StaffMember[]) => {
    setStaff(newStaff);
    setBaseStaff(newStaff.map(({ isActive, ...rest }) => rest as Staff));
  };
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', department: '' });
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = staff.filter(s => filterStatus === 'all' || (filterStatus === 'active' ? s.isActive : !s.isActive));

  const handleDeactivate = () => {
    if (!deactivateId) return;
    saveToStore(staff.map(s => s.id === deactivateId ? { ...s, isActive: false } : s));
    setDeactivateId(null); setDeactivateReason('');
  };
  const handleReactivate = (id: string) => {
    saveToStore(staff.map(s => s.id === id ? { ...s, isActive: true } : s));
  };
  
  const openAdd = () => {
    setEditingStaff(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', department: '' });
    setShowModal(true);
  };
  
  const openEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, email: s.email, phone: s.phone, department: s.department });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.firstName || !form.email) return;
    
    if (editingStaff) {
      saveToStore(staff.map(s => s.id === editingStaff.id ? {
        ...s,
        firstName: form.firstName,
        lastName: form.lastName,
        fullName: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        department: form.department
      } : s));
    } else {
      const id = `staff-${Date.now()}`;
      saveToStore([...staff, {
        id, staffId: `B2MA-STAFF-${String(staff.length + 1).padStart(3,'0')}`,
        firstName: form.firstName, lastName: form.lastName,
        fullName: `${form.firstName} ${form.lastName}`,
        email: form.email, phone: form.phone,
        department: form.department, subjects: [], classes: [],
        hireDate: new Date().toISOString().slice(0,10), isActive: true,
      }]);
    }
    setShowModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Staff Management</h2><p>All teaching and administrative staff</p></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', borderRadius: 8, padding: 4 }}>
            {(['all','active','inactive'] as const).map(f => (
              <button key={f} className={`tab ${filterStatus === f ? 'active' : ''}`} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setFilterStatus(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button id="btn-add-staff" className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Staff</button>
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {filtered.map(sf => (
          <div className="card" key={sf.id} style={{ opacity: sf.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div className="avatar avatar-lg" style={{ background: sf.isActive ? '#3b82f618' : '#ef444418', color: sf.isActive ? '#3b82f6' : '#ef4444' }}>
                {sf.firstName[0]}{sf.lastName[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{sf.fullName}</div>
                  <span className={`badge ${sf.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                    {sf.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{sf.department}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>ID: {sf.staffId}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}><Mail size={13}/> {sf.email}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}><Phone size={13}/> {sf.phone}</div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subjects</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {sf.subjects.map(s => <span key={s} className="badge badge-info">{s}</span>)}
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(sf)}>
                <Edit2 size={13}/> Edit
              </button>
              {sf.isActive
                ? <button id={`deactivate-${sf.id}`} className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => setDeactivateId(sf.id)}>
                    <UserX size={13}/> Deactivate
                  </button>
                : <button id={`reactivate-${sf.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleReactivate(sf.id)}>
                    <UserCheck size={13}/> Reactivate
                  </button>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Full Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '18px 24px' }}>
          <div><h3>Staff Directory</h3><p>Full list with contact details</p></div>
          <UserCog size={16} color="#94a3b8"/>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Staff Member</th><th>Staff ID</th><th>Department</th><th>Phone</th><th>Hired</th><th>Subjects</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              {filtered.map(sf => (
                <tr key={sf.id} style={{ opacity: sf.isActive ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: '#3b82f618', color: '#3b82f6' }}>{sf.firstName[0]}{sf.lastName[0]}</div>
                      <div><div style={{ fontWeight: 600 }}>{sf.fullName}</div><div className="td-muted">{sf.email}</div></div>
                    </div>
                  </td>
                  <td><code style={{ fontSize: 12, background: '#1e2d45', padding: '2px 8px', borderRadius: 4 }}>{sf.staffId}</code></td>
                  <td className="td-muted">{sf.department}</td>
                  <td className="td-muted">{sf.phone}</td>
                  <td className="td-muted">{sf.hireDate}</td>
                  <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{sf.subjects.map(s => <span key={s} className="badge badge-info" style={{ fontSize: 10 }}>{s}</span>)}</div></td>
                  <td><span className={`badge ${sf.isActive ? 'badge-success' : 'badge-danger'}`}>{sf.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(sf)}><Edit2 size={12}/></button>
                      {sf.isActive
                        ? <button className="btn btn-danger btn-sm" id={`tbl-deactivate-${sf.id}`} onClick={() => setDeactivateId(sf.id)}><UserX size={12}/></button>
                        : <button className="btn btn-ghost btn-sm" id={`tbl-reactivate-${sf.id}`} onClick={() => handleReactivate(sf.id)}><UserCheck size={12}/></button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate Modal */}
      {deactivateId && (
        <div className="modal-overlay" onClick={() => setDeactivateId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header"><h3>Deactivate Staff</h3><button className="modal-close" onClick={() => setDeactivateId(null)}>✕</button></div>
            <div className="modal-body">
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
                ⚠ This will prevent {staff.find(s=>s.id===deactivateId)?.fullName} from logging in. Their records will be preserved.
              </div>
              <div className="form-group">
                <label className="form-label">Reason (optional)</label>
                <textarea className="form-input" style={{ resize: 'vertical', minHeight: 80 }} placeholder="e.g. Contract ended, on leave…" value={deactivateReason} onChange={e => setDeactivateReason(e.target.value)}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeactivateId(null)}>Cancel</button>
              <button id="btn-confirm-deactivate" className="btn btn-danger" onClick={handleDeactivate}><UserX size={14}/> Confirm Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))}/></div>
              </div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="btn-save-staff" className="btn btn-primary" onClick={handleSave}><Save size={14}/> {editingStaff ? 'Save Changes' : 'Create Account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
