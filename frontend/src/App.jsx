import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Users, GraduationCap, BookOpen, Pencil, Trash2, ArrowUpDown, RefreshCw, X, Check, CircleAlert } from 'lucide-react';

const API = '/api/students';
const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];
const demoStudents = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@example.com', phone: '9876543210', age: 20, department: 'Computer Science' },
  { id: 2, name: 'Ananya Verma', email: 'ananya@example.com', phone: '9876543211', age: 21, department: 'Electronics' },
  { id: 3, name: 'Rohan Gupta', email: 'rohan@example.com', phone: '9876543212', age: 19, department: 'Mechanical' },
  { id: 4, name: 'Priya Singh', email: 'priya@example.com', phone: '9876543213', age: 20, department: 'Information Technology' },
  { id: 5, name: 'Kabir Mehta', email: 'kabir@example.com', phone: '9876543214', age: 22, department: 'Computer Science' },
];
const blankForm = { name: '', email: '', phone: '', age: '18', department: departments[0] };

function initials(name = '') { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }

export default function App() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [sortName, setSortName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadStudents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (sortName) params.set('sort', 'name');
      const response = await fetch(`${API}?${params.toString()}`);
      if (!response.ok) throw new Error('API request failed');
      const body = await response.json();
      setStudents(body.data || []);
      setApiConnected(true);
      setUsingDemo(false);
    } catch {
      setApiConnected(false);
      setUsingDemo(true);
      const text = query.trim().toLowerCase();
      let rows = demoStudents.filter(s => !text || `${s.name} ${s.email} ${s.department}`.toLowerCase().includes(text));
      if (sortName) rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
      setStudents(rows);
    } finally { setLoading(false); }
  }

  useEffect(() => { const timer = setTimeout(loadStudents, 200); return () => clearTimeout(timer); }, [query, sortName]);

  const stats = useMemo(() => ({ total: students.length, departments: new Set(students.map(s => s.department).filter(Boolean)).size, averageAge: students.length ? Math.round(students.reduce((sum, s) => sum + Number(s.age || 0), 0) / students.length) : 0 }), [students]);

  function openAdd() { setForm(blankForm); setModal({ mode: 'add' }); }
  function openEdit(student) { setForm({ name: student.name, email: student.email, phone: student.phone || '', age: String(student.age || 18), department: student.department || departments[0] }); setModal({ mode: 'edit', id: student.id }); }
  function updateField(event) { setForm(current => ({ ...current, [event.target.name]: event.target.value })); }

  async function saveStudent(event) {
    event.preventDefault(); setSaving(true);
    const payload = { ...form, age: Number(form.age) };
    try {
      if (apiConnected) {
        const url = modal.mode === 'edit' ? `${API}/${modal.id}` : API;
        const response = await fetch(url, { method: modal.mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error('Could not save student');
        setNotice(modal.mode === 'edit' ? 'Student updated successfully.' : 'Student added successfully.');
        setModal(null); await loadStudents();
      } else {
        setStudents(current => modal.mode === 'edit'
          ? current.map(s => s.id === modal.id ? { ...payload, id: modal.id } : s)
          : [{ ...payload, id: Math.max(0, ...current.map(s => s.id)) + 1 }, ...current]);
        setNotice('Saved in demo mode only. Connect the C++ API to persist changes to MySQL.'); setModal(null);
      }
    } catch (error) { setNotice(error.message || 'Something went wrong.'); }
    finally { setSaving(false); }
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Delete ${student.name}?`)) return;
    if (apiConnected) {
      try { const response = await fetch(`${API}/${student.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error(); setNotice('Student deleted.'); await loadStudents(); }
      catch { setNotice('Delete failed. Check that the API and database are running.'); }
    } else { setStudents(current => current.filter(s => s.id !== student.id)); setNotice('Removed from demo view only; database was not changed.'); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><GraduationCap size={23} /></div><div><strong>CampusDesk</strong><span>STUDENT PORTAL</span></div></div>
      <div className="nav-caption">WORKSPACE</div>
      <button className="nav-item active"><Users size={18} /> Students <span className="nav-count">{students.length}</span></button>
      <div className="sidebar-bottom"><div className="sidebar-icon"><BookOpen size={18} /></div><div><strong>Student records</strong><span>Manage your campus data</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Students</b></div><div className="topbar-right"><span className={`connection-dot ${apiConnected ? 'online' : ''}`} /> <span className="connection-label">{apiConnected ? 'API connected' : 'Demo mode'}</span><div className="avatar">AD</div></div></header>
      <section className="page-heading"><div><div className="eyebrow">CAMPUS MANAGEMENT</div><h1>Student records</h1><p>Keep track of your students, departments, and academic details.</p></div><button className="primary-button" onClick={openAdd}><Plus size={18} /> Add student</button></section>
      {usingDemo && <div className="demo-banner"><CircleAlert size={17} /><span><b>Preview mode:</b> The API isn't reachable, so you're seeing sample records. Start the C++ API and MySQL database for live data.</span><button onClick={loadStudents} aria-label="Retry connection"><RefreshCw size={16} /></button></div>}
      {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
      <section className="stats-grid"><div className="stat-card"><div className="stat-icon purple"><Users size={19} /></div><div><span>Total students</span><strong>{stats.total}</strong><small>In current view</small></div></div><div className="stat-card"><div className="stat-icon blue"><BookOpen size={19} /></div><div><span>Departments</span><strong>{stats.departments}</strong><small>Represented here</small></div></div><div className="stat-card"><div className="stat-icon green"><GraduationCap size={19} /></div><div><span>Average age</span><strong>{stats.averageAge || '—'}</strong><small>Years old</small></div></div></section>
      <section className="table-panel"><div className="table-header"><div><h2>All students</h2><p>Student directory and academic information</p></div><div className="table-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students..." /><kbd>⌘ K</kbd></label><button className={`sort-button ${sortName ? 'selected' : ''}`} onClick={() => setSortName(v => !v)}><ArrowUpDown size={16} /> Sort</button></div></div>
        <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>DEPARTMENT</th><th>EMAIL ADDRESS</th><th>AGE</th><th className="actions-heading">ACTIONS</th></tr></thead><tbody>
          {loading ? <tr><td className="empty-state" colSpan="5">Loading student records…</td></tr> : students.length === 0 ? <tr><td className="empty-state" colSpan="5">No students match your search.</td></tr> : students.map((student, index) => <tr key={student.id}><td><div className="student-cell"><div className={`student-avatar tone-${index % 5}`}>{initials(student.name)}</div><div><strong>{student.name}</strong><span>ID #{String(student.id).padStart(4, '0')}</span></div></div></td><td><span className="department-pill">{student.department || 'Unassigned'}</span></td><td className="email-cell">{student.email}</td><td>{student.age}</td><td><div className="row-actions"><button onClick={() => openEdit(student)} title="Edit student"><Pencil size={16} /></button><button className="delete-action" onClick={() => deleteStudent(student)} title="Delete student"><Trash2 size={16} /></button></div></td></tr>)}
        </tbody></table></div><div className="table-footer"><span>Showing <b>{students.length}</b> students</span><button onClick={loadStudents} className="refresh-button"><RefreshCw size={14} /> Refresh</button></div>
      </section>
      <footer className="footer">Student Record Management <span>•</span> Built with React, C++, MySQL & DSA</footer>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(null)}><form className="student-modal" onSubmit={saveStudent}><div className="modal-heading"><div><span className="eyebrow">STUDENT DIRECTORY</span><h2>{modal.mode === 'add' ? 'Add student' : 'Edit student'}</h2></div><button type="button" className="icon-button" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button></div><div className="form-grid"><label className="form-field full"><span>Full name *</span><input name="name" value={form.name} onChange={updateField} required placeholder="e.g. Aarav Sharma" /></label><label className="form-field full"><span>Email address *</span><input type="email" name="email" value={form.email} onChange={updateField} required placeholder="student@example.com" /></label><label className="form-field"><span>Phone</span><input name="phone" value={form.phone} onChange={updateField} placeholder="Phone number" /></label><label className="form-field"><span>Age</span><input type="number" min="1" max="120" name="age" value={form.age} onChange={updateField} required /></label><label className="form-field full"><span>Department</span><select name="department" value={form.department} onChange={updateField}>{departments.map(dept => <option key={dept}>{dept}</option>)}</select></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <RefreshCw className="spin" size={16} /> : <Check size={17} />}{modal.mode === 'add' ? 'Add student' : 'Save changes'}</button></div></form></div>}
  </div>;
}
