import { useState, useRef } from 'react';
import { Save, Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { calcGrade } from '../../data/mockData';
import { Grade, Student } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';

function gradeBadgeColor(score: number) {
  if (score >= 90) return '#a855f7';
  if (score >= 80) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  if (score >= 50) return '#f97316';
  if (score >= 30) return '#ef4444';
  return '#7f1d1d';
}

interface CSVRow { studentId: string; testScore: number; examScore: number; error?: string; }

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const rows: CSVRow[] = [];
  for (const line of lines) {
    if (line.toLowerCase().startsWith('studentid') || line.toLowerCase().startsWith('student_id')) continue;
    const [sid, testStr, examStr] = line.split(',').map(s => s?.trim().replace(/"/g, ''));
    if (!sid) continue;
    const testScore = parseFloat(testStr || '0');
    const examScore = parseFloat(examStr || '0');
    if (isNaN(testScore) || isNaN(examScore) || testScore < 0 || testScore > 30 || examScore < 0 || examScore > 70) {
      rows.push({ studentId: sid, testScore: 0, examScore: 0, error: `Invalid scores: Test=${testStr}, Exam=${examStr}` });
    } else {
      rows.push({ studentId: sid, testScore, examScore });
    }
  }
  return rows;
}

function downloadTemplate(students: Student[], subjectName: string) {
  const header = 'StudentID,TestScore,ExamScore';
  const rows = students.map(s => `${s.studentId},,`);
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `${subjectName.replace(/\s/g,'_')}_grades_template.csv` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Grading() {
  const user = useAuthStore(s => s.user)!;
  const STAFF_LIST = useDataStore(s => s.staff);
  const STUDENTS = useDataStore(s => s.students);
  const CLASSES = useDataStore(s => s.classes);
  const TERMS = useDataStore(s => s.terms);
  const SUBJECTS = useDataStore(s => s.courses);
  const grades = useDataStore(s => s.grades);
  const setGrades = useDataStore(s => s.setGrades);

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
  const [selSubject, setSelSubject] = useState(SUBJECTS[0].id);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  const [csvApplied, setCsvApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const myClasses = CLASSES.filter(c => staffProfile.classes.includes(c.id));
  const studentsInClass = STUDENTS.filter(s => s.classId === selClass);

  const scoreMap: Record<string, { test: number, exam: number }> = {};
  grades.filter(g => g.classId === selClass && g.subjectId === selSubject && g.termId === currentTerm.id)
    .forEach(g => { scoreMap[g.studentId] = { test: g.testScore, exam: g.examScore }; });

  const [scoreEdits, setScoreEdits] = useState<Record<string, { test?: string, exam?: string }>>({});

  const handleScoreChange = (studentId: string, field: 'test' | 'exam', val: string) => {
    setScoreEdits(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: val }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const subjectData = SUBJECTS.find(s => s.id === selSubject)!;
    const updates: Grade[] = [];
    studentsInClass.forEach(st => {
      const edit = scoreEdits[st.id];
      if (!edit) return;
      
      const existing = scoreMap[st.id] || { test: 0, exam: 0 };
      const testScore = edit.test !== undefined ? Math.min(30, Math.max(0, parseFloat(edit.test) || 0)) : existing.test;
      const examScore = edit.exam !== undefined ? Math.min(70, Math.max(0, parseFloat(edit.exam) || 0)) : existing.exam;
      const totalScore = testScore + examScore;
      
      const calc = calcGrade(totalScore);
      const existingGrade = grades.find(g => g.studentId === st.id && g.subjectId === selSubject && g.classId === selClass && g.termId === currentTerm.id);
      
      if (existingGrade) {
        updates.push({ ...existingGrade, testScore, examScore, totalScore, ...calc });
      } else {
        updates.push({ id: `g${Date.now()}-${st.id}`, studentId: st.id, studentName: st.fullName, subjectId: selSubject, subjectName: subjectData.name, classId: selClass, termId: currentTerm.id, testScore, examScore, totalScore, ...calc, recordedBy: staffProfile.fullName, recordedAt: new Date().toISOString().slice(0,10) });
      }
    });
    setGrades(prev => [...prev.filter(g => !updates.find(u => u.id === g.id)), ...updates]);
    setScoreEdits({}); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string);
      setCsvRows(rows); setCsvApplied(false);
    };
    reader.readAsText(file);
  };

  const applyCSV = () => {
    const subjectData = SUBJECTS.find(s => s.id === selSubject)!;
    const validRows = csvRows.filter(r => !r.error);
    const updates: Grade[] = [];
    validRows.forEach(row => {
      const st = studentsInClass.find(s => s.studentId === row.studentId);
      if (!st) return;
      const totalScore = row.testScore + row.examScore;
      const calc = calcGrade(totalScore);
      const existingGrade = grades.find(g => g.studentId === st.id && g.subjectId === selSubject && g.classId === selClass && g.termId === currentTerm.id);
      
      if (existingGrade) {
        updates.push({ ...existingGrade, testScore: row.testScore, examScore: row.examScore, totalScore, ...calc });
      } else {
        updates.push({ id: `g${Date.now()}-${st.id}`, studentId: st.id, studentName: st.fullName, subjectId: selSubject, subjectName: subjectData.name, classId: selClass, termId: currentTerm.id, testScore: row.testScore, examScore: row.examScore, totalScore, ...calc, recordedBy: staffProfile.fullName, recordedAt: new Date().toISOString().slice(0,10) });
      }
    });
    setGrades(prev => [...prev.filter(g => !updates.find(u => u.id === g.id)), ...updates]);
    setCsvApplied(true);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Grade Entry</h2><p>Enter Test & Exam scores — total and letter grade calculate automatically</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" id="btn-download-template" onClick={() => downloadTemplate(studentsInClass, SUBJECTS.find(s=>s.id===selSubject)?.name ?? 'grades')}><Download size={14}/> CSV Template</button>
          <button id="btn-save-grades" className="btn btn-staff" onClick={handleSave}><Save size={14}/> Save Grades</button>
        </div>
      </div>

      {saved && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>✓ Grades saved successfully!</div>}

      {/* Selectors */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Intake Cohort</label>
            <select id="sel-class" className="form-select" value={selClass} onChange={e => { setSelClass(e.target.value); setScoreEdits({}); }}>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Course</label>
            <select id="sel-subject" className="form-select" value={selSubject} onChange={e => { setSelSubject(e.target.value); setScoreEdits({}); }}>
              {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>✏️ Manual Entry</button>
        <button className={`tab ${tab === 'csv' ? 'active' : ''}`} id="tab-csv-upload" onClick={() => setTab('csv')}><Upload size={13}/> Bulk CSV Upload</button>
      </div>

      {/* CSV Upload Tab */}
      {tab === 'csv' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div><h3>Bulk Grade Upload</h3><p>Upload a CSV file with StudentID, TestScore (30), and ExamScore (70)</p></div></div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <input ref={fileRef} type="file" accept=".csv" id="input-csv-file" style={{ display: 'none' }} onChange={handleFileUpload}/>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={14}/> Choose CSV File</button>
            <span style={{ fontSize: 12, color: '#64748b' }}>Format: StudentID, TestScore, ExamScore</span>
          </div>
          {csvRows.length > 0 && (
            <>
              <div className="table-wrap" style={{ marginBottom: 14 }}>
                <table>
                  <thead><tr><th>Student ID</th><th>Name</th><th>Test (30)</th><th>Exam (70)</th><th>Total</th><th>Grade</th><th>Status</th></tr></thead>
                  <tbody>
                    {csvRows.map((row, i) => {
                      const st = studentsInClass.find(s => s.studentId === row.studentId);
                      const total = row.testScore + row.examScore;
                      const g = !row.error ? calcGrade(total) : null;
                      return (
                        <tr key={i} style={{ background: row.error ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                          <td><code style={{ fontSize: 12 }}>{row.studentId}</code></td>
                          <td style={{ fontWeight: 600 }}>{st?.fullName ?? <span style={{ color: '#ef4444' }}>Not found</span>}</td>
                          <td style={{ fontWeight: 700 }}>{row.error ? '—' : row.testScore}</td>
                          <td style={{ fontWeight: 700 }}>{row.error ? '—' : row.examScore}</td>
                          <td style={{ fontWeight: 900, color: '#3b82f6' }}>{row.error ? '—' : `${total}%`}</td>
                          <td>{g && <span style={{ fontWeight: 800, color: gradeBadgeColor(total) }}>{g.letterGrade}</span>}</td>
                          <td>{row.error ? <span style={{ color: '#ef4444', fontSize: 11 }}>⚠ {row.error}</span> : <span style={{ color: '#22c55e', fontSize: 11 }}>✓ Valid</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {csvApplied
                ? <div style={{ color: '#4ade80', fontWeight: 600, fontSize: 13 }}><CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }}/>Grades applied! Switch to Manual Entry to review.</div>
                : <button id="btn-apply-csv" className="btn btn-staff" onClick={applyCSV}><CheckCircle size={14}/> Apply {csvRows.filter(r=>!r.error).length} Valid Grades</button>
              }
            </>
          )}
        </div>
      )}

      {/* Manual Grade Table */}
      {tab === 'manual' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 24px' }}>
            <div><h3>{CLASSES.find(c => c.id === selClass)?.name} — {SUBJECTS.find(s => s.id === selSubject)?.name}</h3><p>{studentsInClass.length} students · {currentTerm.name}</p></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Student</th><th>Test (30)</th><th>Exam (70)</th><th>Total</th><th>Grade</th><th>Descriptor</th></tr></thead>
              <tbody>
                {studentsInClass.map((st, idx) => {
                  const edit = scoreEdits[st.id] || {};
                  const existing = scoreMap[st.id];
                  
                  const displayTest = edit.test !== undefined ? edit.test : (existing ? existing.test : '');
                  const displayExam = edit.exam !== undefined ? edit.exam : (existing ? existing.exam : '');
                  
                  const parsedTest = Math.min(30, Math.max(0, parseFloat(displayTest as string) || 0));
                  const parsedExam = Math.min(70, Math.max(0, parseFloat(displayExam as string) || 0));
                  const totalScore = parsedTest + parsedExam;
                  
                  const hasData = displayTest !== '' || displayExam !== '';
                  const gradeInfo = hasData ? calcGrade(totalScore) : null;
                  const color = gradeInfo ? gradeBadgeColor(totalScore) : '#64748b';
                  
                  return (
                    <tr key={st.id}>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {st.photoUrl ? (
                            <img src={st.photoUrl} className="avatar" style={{ objectFit: 'cover' }} alt="" />
                          ) : (
                            <div className="avatar" style={{ background: '#3b82f618', color: '#3b82f6' }}>{st.firstName[0]}{st.lastName[0]}</div>
                          )}
                          <div><div style={{ fontWeight: 600 }}>{st.fullName}</div><div className="td-muted">{st.studentId}</div></div>
                        </div>
                      </td>
                      <td><input className="score-input" type="number" min={0} max={30} placeholder="—" value={displayTest} onChange={e => handleScoreChange(st.id, 'test', e.target.value)}/></td>
                      <td><input className="score-input" type="number" min={0} max={70} placeholder="—" value={displayExam} onChange={e => handleScoreChange(st.id, 'exam', e.target.value)}/></td>
                      <td>{hasData ? <span style={{ fontWeight: 900, color: '#3b82f6' }}>{totalScore}%</span> : <span style={{ color: '#4b6080' }}>—</span>}</td>
                      <td>{gradeInfo ? <span style={{ fontWeight: 800, fontSize: 18, color }}>{gradeInfo.letterGrade}</span> : <span style={{ color: '#4b6080' }}>—</span>}</td>
                      <td>{gradeInfo ? <span className="badge" style={{ background: `${color}18`, color }}>{gradeInfo.descriptiveWord}</span> : <span style={{ color: '#4b6080' }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading Scale */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3>Grading Scale Reference</h3></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[{range:'90–100',letter:'A+',word:'Outstanding',color:'#a855f7'},{range:'80–89',letter:'A',word:'Excellent',color:'#22c55e'},{range:'70–79',letter:'B',word:'Good',color:'#3b82f6'},{range:'60–69',letter:'C',word:'Average',color:'#f59e0b'},{range:'50–59',letter:'D',word:'Poor',color:'#f97316'},{range:'30–49',letter:'F',word:'Failed',color:'#ef4444'},{range:'0–29',letter:'F-',word:'Worst',color:'#7f1d1d'}].map(g => (
            <div key={g.letter} style={{ padding: '10px 16px', borderRadius: 10, background: `${g.color}12`, border: `1px solid ${g.color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: g.color }}>{g.letter}</span>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: g.color }}>{g.word}</div><div style={{ fontSize: 10, color: '#64748b' }}>{g.range}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
