import { useState } from 'react';
import { Plus, Edit2, Calendar, BookOpen, Users, CheckCircle, Trash2 } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { Term, Class, Course } from '../../types';

type ActiveTab = 'terms' | 'classes' | 'courses';

export default function AcademicSetup() {
  const [tab, setTab] = useState<ActiveTab>('terms');
  const terms = useDataStore(s => s.terms);
  const setTerms = useDataStore(s => s.setTerms);
  const classes = useDataStore(s => s.classes);
  const setClasses = useDataStore(s => s.setClasses);
  const courses = useDataStore(s => s.courses);
  const setCourses = useDataStore(s => s.setCourses);
  const [showModal, setShowModal] = useState(false);

  // ── Term form ───────────────────────────────────────────────
  const [tName, setTName]         = useState('');
  const [tStart, setTStart]       = useState('');
  const [tEnd, setTEnd]           = useState('');

  // ── Class form ──────────────────────────────────────────────
  const [cName, setCName]         = useState('');
  const [cCapacity, setCCapacity] = useState(40);
  const [cTermId, setCTermId]     = useState(terms[0]?.id ?? '');

  // ── Course form ────────────────────────────────────────────
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [sName, setSName]         = useState('');
  const [sCode, setSCode]         = useState('');
  const [sDepartment, setSDepartment] = useState<Course['department']>('Creative Media');
  const [sDuration, setSDuration] = useState(6);

  const currentTerm = terms.find(t => t.isCurrent);

  const setCurrentTerm = (id: string) => {
    setTerms(prev => prev.map(t => ({ ...t, isCurrent: t.id === id })));
  };

  const addTerm = () => {
    if (!tName || !tStart || !tEnd) return;
    const newTerm: Term = {
      id: `term-${Date.now()}`,
      name: tName,
      startDate: tStart,
      endDate: tEnd,
      isCurrent: terms.length === 0,
    };
    setTerms(prev => [...prev, newTerm]);
    setTName(''); setTStart(''); setTEnd('');
    setShowModal(false);
  };

  const addClass = () => {
    if (!cName) return;
    const newClass: Class = {
      id: `cls-${Date.now()}`,
      name: cName,
      termId: cTermId,
      capacity: cCapacity,
      studentCount: 0,
    };
    setClasses(prev => [...prev, newClass]);
    setCName(''); setCCapacity(40);
    setShowModal(false);
  };

  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setSName(course.name);
      setSCode(course.code);
      setSDepartment(course.department);
      setSDuration(course.durationMonths);
    } else {
      setEditingCourse(null);
      setSName('');
      setSCode('');
      setSDepartment('Creative Media');
      setSDuration(6);
    }
    setShowModal(true);
  };

  const handleCourseSave = () => {
    if (!sName || !sCode) return;
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? {
        ...c, name: sName, code: sCode, department: sDepartment, durationMonths: sDuration
      } : c));
    } else {
      const newCourse: Course = {
        id: `crs-${Date.now()}`,
        name: sName,
        code: sCode,
        department: sDepartment,
        durationMonths: sDuration,
      };
      setCourses(prev => [...prev, newCourse]);
    }
    setShowModal(false);
  };

  const deleteCourse = (id: string) => {
    if (window.confirm("Delete this course?")) {
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Academic Setup</h2><p>Manage terms, classes and courses</p></div>
        <button id="btn-add-new" className="btn btn-primary" onClick={() => tab === 'courses' ? openCourseModal() : setShowModal(true)}>
          <Plus size={14}/> Add New
        </button>
      </div>

      {/* Current Term Banner */}
      {currentTerm && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#a855f722', borderRadius: 12, padding: 12 }}>
              <Calendar size={24} color="#a855f7"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Active Term</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{currentTerm.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{currentTerm.startDate} → {currentTerm.endDate}</div>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'terms' ? 'active' : ''}`} id="tab-terms" onClick={() => setTab('terms')}><Calendar size={14}/> Terms ({terms.length})</button>
        <button className={`tab ${tab === 'classes' ? 'active' : ''}`} id="tab-classes" onClick={() => setTab('classes')}><Users size={14}/> Classes ({classes.length})</button>
        <button className={`tab ${tab === 'courses' ? 'active' : ''}`} id="tab-courses" onClick={() => setTab('courses')}><BookOpen size={14}/> Courses ({courses.length})</button>
      </div>

      {/* Terms Table */}
      {tab === 'terms' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Term Name</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {terms.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700 }}>{t.name}</td>
                    <td className="td-muted">{t.startDate}</td>
                    <td className="td-muted">{t.endDate}</td>
                    <td>
                      <span className={`badge ${t.isCurrent ? 'badge-success' : 'badge-muted'}`}>
                        {t.isCurrent ? '✓ Current' : 'Past'}
                      </span>
                    </td>
                    <td>
                      {!t.isCurrent && (
                        <button className="btn btn-ghost btn-sm" id={`set-current-${t.id}`} onClick={() => setCurrentTerm(t.id)}>
                          <CheckCircle size={12}/> Set Current
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Classes Table */}
      {tab === 'classes' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Intake Cohort Name</th><th>Students</th><th>Capacity</th><th>Occupancy</th></tr></thead>
              <tbody>
                {classes.map(c => {
                  const pct = Math.round((c.studentCount / c.capacity) * 100);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td style={{ fontWeight: 600, color: '#3b82f6' }}>{c.studentCount}</td>
                      <td className="td-muted">{c.capacity}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-bar-wrap" style={{ width: 100 }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct > 85 ? '#ef4444' : '#3b82f6' }}/>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pct > 85 ? '#ef4444' : '#64748b' }}>{pct}%</span>
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

      {/* Courses Table */}
      {tab === 'courses' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Course Name</th><th>Code</th><th>Department</th><th>Duration</th><th>Actions</th></tr></thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td><span className="badge badge-info">{c.code}</span></td>
                    <td className="td-muted">{c.department}</td>
                    <td className="td-muted">{c.durationMonths} Months</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openCourseModal(c)}><Edit2 size={14}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c.id)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>{editingCourse ? 'Edit' : 'Add'} {tab === 'terms' ? 'Term' : tab === 'classes' ? 'Intake Cohort' : 'Course'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {tab === 'terms' && (
                <>
                  <div className="form-group"><label className="form-label">Term Name</label><input className="form-input" value={tName} onChange={e => setTName(e.target.value)} placeholder="e.g. Term 1 – 2025"/></div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={tStart} onChange={e => setTStart(e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-input" value={tEnd} onChange={e => setTEnd(e.target.value)}/></div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={addTerm}>Create Term</button>
                </>
              )}
              {tab === 'classes' && (
                <>
                  <div className="form-group"><label className="form-label">Intake Cohort Name</label><input className="form-input" value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g. Jan 2025 Intake"/></div>
                  <div className="form-group"><label className="form-label">Capacity</label><input type="number" className="form-input" value={cCapacity} onChange={e => setCCapacity(Number(e.target.value))}/></div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={addClass}>Create Cohort</button>
                </>
              )}
              {tab === 'courses' && (
                <>
                  <div className="form-group"><label className="form-label">Course Name</label><input className="form-input" value={sName} onChange={e => setSName(e.target.value)} placeholder="e.g. Photography"/></div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Course Code</label><input className="form-input" value={sCode} onChange={e => setSCode(e.target.value)} placeholder="e.g. PHO101"/></div>
                    <div className="form-group"><label className="form-label">Duration (Months)</label><input type="number" className="form-input" value={sDuration} onChange={e => setSDuration(Number(e.target.value))}/></div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={sDepartment} onChange={e => setSDepartment(e.target.value as Course['department'])}>
                      <option value="Creative Media">Creative Media</option>
                      <option value="Audio & Music">Audio & Music</option>
                      <option value="IT & Technology">IT & Technology</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCourseSave}>{editingCourse ? 'Save Changes' : 'Create Course'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
