import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Users, GraduationCap, BookOpen, Pencil, Trash2, ArrowUpDown, RefreshCw, X, Check, CircleAlert } from 'lucide-react';

const API = '/api/students';
const DEMO_STORAGE_KEY = 'campusdesk-students-v1';
const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];
const demoStudents = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@example.com', phone: '9876543210', age: 20, department: 'Computer Science' },
  { id: 2, name: 'Ananya Verma', email: 'ananya@example.com', phone: '9876543211', age: 21, department: 'Electronics' },
  { id: 3, name: 'Rohan Gupta', email: 'rohan@example.com', phone: '9876543212', age: 19, department: 'Mechanical' },
  { id: 4, name: 'Priya Singh', email: 'priya@example.com', phone: '9876543213', age: 20, department: 'Information Technology' },
  { id: 5, name: 'Kabir Mehta', email: 'kabir@example.com', phone: '9876543214', age: 22, department: 'Computer Science' },
];
const sortOptions = [
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'age-asc', label: 'Age: low to high' },
  { value: 'age-desc', label: 'Age: high to low' },
  { value: 'department', label: 'Department' },
];
const blankForm = { name: '', email: '', phone: '', age: '18', department: departments[0] };

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
}

function readDemoStudents() {
  try {
    const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Storage may be unavailable in private browsing; fall back to sample data.
  }
  return demoStudents.map(student => ({ ...student }));
}

function writeDemoStudents(students) {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(students));
    return true;
  } catch {
    return false;
  }
}

function filterAndSort(rows, searchText, sortMode) {
  const needle = searchText.trim().toLowerCase();
  const filtered = rows.filter(student => {
    const searchable = [student.id, student.name, student.email, student.phone, student.department, student.age]
      .filter(value => value !== null && value !== undefined)
      .join(' ')
      .toLowerCase();
    return !needle || searchable.includes(needle);
  });

  return filtered.sort((a, b) => {
    switch (sortMode) {
      case 'name-desc': return String(b.name || '').localeCompare(String(a.name || ''));
      case 'age-asc': return Number(a.age || 0) - Number(b.age || 0) || String(a.name || '').localeCompare(String(b.name || ''));
      case 'age-desc': return Number(b.age || 0) - Number(a.age || 0) || String(a.name || '').localeCompare(String(b.name || ''));
      case 'department': return String(a.department || '').localeCompare(String(b.department || '')) || String(a.name || '').localeCompare(String(b.name || ''));
      case 'name-asc':
      default: return String(a.name || '').localeCompare(String(b.name || ''));
    }
  });
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('name-asc');
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
      const response = await fetch(API);
      if (!response.ok) throw new Error('API request failed');
      const body = await response.json();
      const rows = Array.isArray(body.data) ? body.data : [];
      setStudents(filterAndSort(rows, query, sortMode));
      setApiConnected(true);
      setUsingDemo(false);
    } catch {
      setApiConnected(false);
      setUsingDemo(true);
      setStudents(filterAndSort(readDemoStudents(), query, sortMode));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { loadStudents(); }, 150);
    return () => clearTimeout(timer);
  }, [query, sortMode]);

  const stats = useMemo(() => ({
    total: students.length,
    departments: new Set(students.map(s => s.department).filter(Boolean)).size,
    averageAge: students.length ? Math.round(students.reduce((sum, s) => sum + Number(s.age || 0), 0) / students.length) : 0,
  }), [students]);

  function openAdd() {
    setForm(blankForm);
    setModal({ mode: 'add' });
  }

  function openEdit(student) {
    setForm({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      age: String(student.age || 18),
      department: student.department || departments[0],
    });
    setModal({ mode: 'edit', id: student.id });
  }

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveStudent(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      age: Number(form.age),
    };

    try {
      if (apiConnected) {
        const url = modal.mode === 'edit' ? `${API}/${modal.id}` : API;
        const response = await fetch(url, {
          method: modal.mode === 'edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Could not save student. Please check the API.');
        setNotice(modal.mode === 'edit' ? 'Student updated successfully.' : 'Student added successfully.');
      } else {
        const allStudents = readDemoStudents();
        let updated;
        if (modal.mode === 'edit') {
          updated = allStudents.map(student => student.id === modal.id ? { ...payload, id: modal.id } : student);
        } else {
          const nextId = Math.max(0, ...allStudents.map(student => Number(student.id) || 0)) + 1;
          updated = [{ ...payload, id: nextId }, ...allStudents];
        }
        const stored = writeDemoStudents(updated);
        setNotice(stored
          ? (modal.mode === 'edit' ? 'Student updated. Demo changes are saved in this browser.' : 'Student added. Demo changes are saved in this browser.')
          : 'Student updated for this view, but browser storage is unavailable.');
      }
      setModal(null);
      await loadStudents();
    } catch (error) {
      setNotice(error.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Delete ${student.name}?`)) return;

    if (apiConnected) {
      try {
        const response = await fetch(`${API}/${student.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete request failed');
        setNotice('Student deleted successfully.');
        await loadStudents();
      } catch {
        setNotice('Delete failed. Check that the API and database are running.');
      }
      return;
    }

    const updated = readDemoStudents().filter(item => item.id !== student.id);
    const stored = writeDemoStudents(updated);
    setNotice(stored ? 'Student deleted. Demo changes are saved in this browser.' : 'Student removed from the current view, but browser storage is unavailable.');
    await loadStudents();
  }

  function cycleSort() {
    const currentIndex = sortOptions.findIndex(option => option.value === sortMode);
    setSortMode(sortOptions[(currentIndex + 1) % sortOptions.length].value);
  }

  const currentSortLabel = sortOptions.find(option => option.value === sortMode)?.label || 'Name A–Z';

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
      {usingDemo && <div className="demo-banner"><CircleAlert size={17} /><span><b>Preview mode:</b> The API isn't reachable, so you're seeing sample records. Search, sorting, editing, and deleting work locally in this browser. These demo changes are not written to MySQL.</span><button onClick={loadStudents} aria-label="Retry connection"><RefreshCw size={16} /></button></div>}
      {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
      <section className="stats-grid"><div className="stat-card"><div className="stat-icon purple"><Users size={19} /></div><div><span>Total students</span><strong>{stats.total}</strong><small>In current view</small></div></div><div className="stat-card"><div className="stat-icon blue"><BookOpen size={19} /></div><div><span>Departments</span><strong>{stats.departments}</strong><small>Represented here</small></div></div><div className="stat-card"><div className="stat-icon green"><GraduationCap size={19} /></div><div><span>Average age</span><strong>{stats.averageAge || '—'}</strong><small>Years old</small></div></div></section>
      <section className="table-panel"><div className="table-header"><div><h2>All students</h2><p>Student directory and academic information</p></div><div className="table-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email, department..." aria-label="Search students" /><kbd>⌘ K</kbd></label><button className={`sort-button ${sortMode !== 'name-asc' ? 'selected' : ''}`} onClick={cycleSort} title="Click to cycle through sort options"><ArrowUpDown size={16} /> {currentSortLabel}</button></div></div>
        <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>DEPARTMENT</th><th>EMAIL ADDRESS</th><th>AGE</th><th className="actions-heading">ACTIONS</th></tr></thead><tbody>
          {loading ? <tr><td className="empty-state" colSpan="5">Loading student records…</td></tr> : students.length === 0 ? <tr><td className="empty-state" colSpan="5">No students match your search.</td></tr> : students.map((student, index) => <tr key={student.id}><td><div className="student-cell"><div className={`student-avatar tone-${index % 5}`}>{initials(student.name)}</div><div><strong>{student.name}</strong><span>ID #{String(student.id).padStart(4, '0')}</span></div></div></td><td><span className="department-pill">{student.department || 'Unassigned'}</span></td><td className="email-cell">{student.email}</td><td>{student.age}</td><td><div className="row-actions"><button onClick={() => openEdit(student)} title="Edit student" aria-label={`Edit ${student.name}`}><Pencil size={16} /></button><button className="delete-action" onClick={() => deleteStudent(student)} title="Delete student" aria-label={`Delete ${student.name}`}><Trash2 size={16} /></button></div></td></tr>)}
        </tbody></table></div><div className="table-footer"><span>Showing <b>{students.length}</b> students</span><button onClick={loadStudents} className="refresh-button"><RefreshCw size={14} /> Refresh</button></div>
      </section>
      <footer className="footer">Student Record Management <span>•</span> Built with React, C++, MySQL & DSA</footer>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(null)}><form className="student-modal" onSubmit={saveStudent}><div className="modal-heading"><div><span className="eyebrow">STUDENT DIRECTORY</span><h2>{modal.mode === 'add' ? 'Add student' : 'Edit student'}</h2></div><button type="button" className="icon-button" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button></div><div className="form-grid"><label className="form-field full"><span>Full name *</span><input name="name" value={form.name} onChange={updateField} required placeholder="e.g. Aarav Sharma" /></label><label className="form-field full"><span>Email address *</span><input type="email" name="email" value={form.email} onChange={updateField} required placeholder="student@example.com" /></label><label className="form-field"><span>Phone</span><input name="phone" value={form.phone} onChange={updateField} placeholder="Phone number" /></label><label className="form-field"><span>Age</span><input type="number" min="1" max="120" name="age" value={form.age} onChange={updateField} required /></label><label className="form-field full"><span>Department</span><select name="department" value={form.department} onChange={updateField}>{departments.map(dept => <option key={dept}>{dept}</option>)}</select></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <RefreshCw className="spin" size={16} /> : <Check size={17} />}{modal.mode === 'add' ? 'Add student' : 'Save changes'}</button></div></form></div>}
  </div>;
}
