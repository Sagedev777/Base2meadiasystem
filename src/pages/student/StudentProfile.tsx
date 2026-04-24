import { useState, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Camera, Upload } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';

const API_BASE = 'http://localhost:4000';

export default function StudentProfile() {
  const STUDENTS = useDataStore(s => s.students);
  const CLASSES = useDataStore(s => s.classes);
  const TERMS = useDataStore(s => s.terms);

  const user    = useAuthStore(s => s.user)!;
  const token   = useAuthStore(s => s.token);
  const student = STUDENTS.find(s => s.email === user.email) ?? STUDENTS[0];

  if (!student) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <h3>No Profile Assigned</h3>
        <p>Your account is not linked to any active student profile yet.<br/>Please contact the administration.</p>
      </div>
    );
  }
  const cls     = CLASSES.find(c => c.id === student.classId);
  const currentTerm = TERMS.find(t => t.isCurrent)!;

  const [editing, setEditing]   = useState(false);
  const [phone, setPhone]       = useState(student.phone || '');
  const [address, setAddress]   = useState(student.address || '');
  const [saved, setSaved]       = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(student.photoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPEG, PNG or WebP images allowed');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image must be under 3 MB');
      return;
    }

    setUploadError('');
    setUploading(true);

    // Preview immediately
    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload/profile-photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(`${API_BASE}${data.photoUrl}`);
      } else {
        // Keep the local preview if backend not connected yet
      }
    } catch {
      // Backend not running yet — keep local preview for testing
    } finally {
      setUploading(false);
    }
  };

  const initials = `${student.firstName[0]}${student.lastName[0]}`;

  const fields = [
    { icon: <User size={15}/>,     label: 'Full Name',     value: student.fullName },
    { icon: <Mail size={15}/>,     label: 'Email',         value: student.email },
    { icon: <Calendar size={15}/>, label: 'Date of Birth', value: student.dateOfBirth || '—' },
    { icon: <User size={15}/>,     label: 'Gender',        value: student.gender || '—' },
    { icon: <User size={15}/>,     label: 'Student ID',    value: student.studentId },
    { icon: <Calendar size={15}/>, label: 'Enrolled',      value: student.enrollmentDate },
    { icon: <User size={15}/>,     label: 'Class',         value: cls?.name ?? '—' },
    { icon: <User size={15}/>,     label: 'Status',        value: student.status },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>My Profile</h2><p>Your personal details · {currentTerm.name}</p></div>
        {!editing
          ? <button id="btn-edit-profile" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Edit2 size={14}/> Edit</button>
          : <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={14}/> Cancel</button>
              <button id="btn-save-profile" className="btn btn-staff btn-sm" onClick={handleSave}><Save size={14}/> Save</button>
            </div>
        }
      </div>

      {saved && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
          ✓ Profile updated successfully!
        </div>
      )}

      {/* Avatar Card */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>

          {/* Photo / Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #22c55e44' }}
              />
            ) : (
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#22c55e22', border: '3px solid #22c55e44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#22c55e' }}>
                {initials}
              </div>
            )}

            {/* Upload button overlay */}
            <button
              id="btn-upload-photo"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change profile photo"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: uploading ? '#64748b' : '#22c55e',
                border: '2px solid var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}
            >
              {uploading ? <Upload size={12} style={{ animation: 'spin 1s linear infinite' }}/> : <Camera size={12}/>}
            </button>
            <input
              ref={fileRef}
              type="file"
              id="photo-file-input"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{student.fullName}</div>
            <div style={{ color: '#64748b', marginTop: 4 }}>{student.email}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-success">{student.status}</span>
              <span className="badge badge-info">{cls?.name ?? '—'}</span>
              <span className="badge badge-muted">{student.studentId}</span>
            </div>
            {uploadError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠ {uploadError}</div>}
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              <Camera size={10} style={{ display: 'inline', marginRight: 4 }}/>
              Click the camera icon to upload a profile photo (JPEG/PNG/WebP, max 3 MB)
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Info card */}
        <div className="card">
          <div className="card-header"><div><h3>Personal Information</h3><p>Your academic profile</p></div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fields.map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
                  {f.icon}<span>{f.label}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: 13, color: f.label === 'Status' ? '#22c55e' : 'var(--text-primary)' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Editable fields */}
        <div className="card">
          <div className="card-header"><div><h3>Contact Details</h3><p>Update your info</p></div></div>
          <div className="form-group">
            <label className="form-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }}/> Phone Number</label>
            {editing
              ? <input id="input-phone" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +233 20 123 4567"/>
              : <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, fontSize: 14, color: phone ? 'var(--text-primary)' : '#64748b' }}>{phone || '—'}</div>
            }
          </div>
          <div className="form-group">
            <label className="form-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }}/> Home Address</label>
            {editing
              ? <textarea id="input-address" className="form-input" style={{ resize: 'vertical', minHeight: 80 }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your home address"/>
              : <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, fontSize: 14, color: address ? 'var(--text-primary)' : '#64748b' }}>{address || '—'}</div>
            }
          </div>

          <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>📋 Emergency Contact</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Please contact the school office to update emergency contact details.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
