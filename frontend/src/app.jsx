import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Plus, Edit2, Trash2, LogOut, GraduationCap, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = "http://localhost:5000/api";

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Core App Data States
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', age: '', current_class: '',
    marks: {
      "Telugu": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 },
      "Hindi": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 },
      "English": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 },
      "Social Studies": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 }
    }
  });

  // Fetch Student Records from API Backend
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/students`, {
        params: { search: searchQuery, page: currentPage }
      });
      setStudents(response.data.students);
      setTotalPages(response.data.totalPages);

      // Auto-refresh the active selected student panel if they are in the updated dataset
      if (selectedStudent) {
        const matching = response.data.students.find(s => s.id === selectedStudent.id);
        if (matching) setSelectedStudent(matching);
      }
    } catch (err) {
      console.error("Error loading application data", err);
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token, searchQuery, currentPage]);

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
      localStorage.setItem('authToken', res.data.token);
      setToken(res.data.token);
      setAuthError('');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication Failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setSelectedStudent(null);
  };

  // Delete Action Execution
  const handleDelete = async (id) => {
    if (window.confirm("Are you absolutely sure you want to delete this student record?")) {
      try {
        await axios.delete(`${API_BASE}/students/${id}`);
        if (selectedStudent?.id === id) setSelectedStudent(null);
        fetchStudents();
      } catch (err) {
        alert("Deletion operation failed.");
      }
    }
  };

  // Form Management Setup
  const openCreateModal = () => {
    setEditingStudentId(null);
    setFormData({
      name: '', age: '', current_class: '',
      marks: {
        "Telugu": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 },
        "Hindi": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 },
        "English": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 },
        "Social Studies": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0 }
      }
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudentId(student.id);
    setFormData({
      name: student.name,
      age: student.age,
      current_class: student.current_class,
      marks: JSON.parse(JSON.stringify(student.marks)) // Deep Copy
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudentId) {
        await axios.put(`${API_BASE}/students/${editingStudentId}`, formData);
      } else {
        await axios.post(`${API_BASE}/students`, formData);
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert("Error saving record item entries.");
    }
  };

  const handleMarkChange = (subject, month, value) => {
    setFormData(prev => ({
      ...prev,
      marks: {
        ...prev.marks,
        [subject]: {
          ...prev.marks[subject],
          [month]: parseInt(value) || 0
        }
      }
    }));
  };

  // Helper function to calculate Average Subject performance for table columns
  const getSubjectAverage = (marksObj, subject) => {
    if (!marksObj || !marksObj[subject]) return 0;
    const scores = Object.values(marksObj[subject]);
    const sum = scores.reduce((a, b) => a + b, 0);
    return (sum / scores.length).toFixed(1);
  };

  // Map individual timeline map sets to Recharts compatible coordinate arrays
  const prepareChartData = (marksObj, subject) => {
    if (!marksObj || !marksObj[subject]) return [];
    return ["January", "February", "March", "April", "May", "June"].map(m => ({
      month: m.substring(0, 3),
      Marks: marksObj[subject][m] || 0
    }));
  };

  // --- RENDERING VIEWS ---
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight">Admin Portal Login</h1>
          </div>
          {authError && <div className="mb-4 text-sm bg-red-50 text-red-600 p-2.5 rounded border border-red-200">{authError}</div>}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter admin" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter password123" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-semibold shadow transition-colors">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar View Top */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Student Performance Analytics Platform</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      {/* Main Core Flexboard Frame */}
      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* Left Side Container Panel: Database management and listings */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-5 h-5" />
              </span>
              <input type="text" placeholder="Fuzzy Search student name (e.g. Rahul, Rah)..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
            </div>
            <button onClick={openCreateModal} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Add Student Record
            </button>
          </div>

          {/* Student Records Data Table View Grid */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-3 text-center">Select</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Age</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-center text-indigo-600">Telugu Avg</th>
                  <th className="px-4 py-3 text-center text-indigo-600">Hindi Avg</th>
                  <th className="px-4 py-3 text-center text-indigo-600">English Avg</th>
                  <th className="px-4 py-3 text-center text-indigo-600">Social Avg</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.map((student) => (
                  <tr key={student.id} className={`hover:bg-indigo-50/40 transition-colors ${selectedStudent?.id === student.id ? 'bg-indigo-50/80' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={selectedStudent?.id === student.id} onChange={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{student.age}</td>
                    <td className="px-4 py-3 text-gray-600">{student.current_class}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{getSubjectAverage(student.marks, 'Telugu')}%</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{getSubjectAverage(student.marks, 'Hindi')}%</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{getSubjectAverage(student.marks, 'English')}%</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{getSubjectAverage(student.marks, 'Social Studies')}%</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openEditModal(student)} className="text-gray-500 hover:text-indigo-600 p-1 rounded hover:bg-white border border-transparent hover:border-gray-200"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(student.id)} className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-white border border-transparent hover:border-gray-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-400">No matching student records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation Controls */}
          <div className="flex items-center justify-between mt-4 bg-gray-50 p-3 rounded-lg border">
            <span className="text-xs font-medium text-gray-600">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Right Side Dashboard Panel Component: Live Subject Chart Analytics */}
        <div className="w-full lg:w-[420px] shrink-0 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-start">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin-slow" /> Real-time Analytics View
          </h2>
          {selectedStudent ? (
            <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-inner">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Currently Selected</p>
                <h3 className="text-xl font-bold text-indigo-900 mt-0.5">{selectedStudent.name}</h3>
                <div className="flex gap-4 mt-2 text-sm text-slate-600 font-medium">
                  <span>Age: <strong className="text-slate-900">{selectedStudent.age}</strong></span>
                  <span>Class: <strong className="text-slate-900">{selectedStudent.current_class}</strong></span>
                </div>
              </div>

              {/* Four Independent Line Graphs */}
              {['Telugu', 'Hindi', 'English', 'Social Studies'].map((subj, idx) => (
                <div key={subj} className="border border-gray-100 p-3 rounded-xl bg-white shadow-sm">
                  <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wide mb-2 pl-1">{idx + 1}. {subj} Performance Trend</h4>
                  <div className="h-[140px] w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareChartData(selectedStudent.marks, subj)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" />
                        <Tooltip />
                        <Line type="monotone" dataKey="Marks" stroke={idx === 0 ? "#4f46e5" : idx === 1 ? "#059669" : idx === 2 ? "#ca8a04" : "#dc2626"} strokeWidth={2.5} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <input type="checkbox" disabled className="w-5 h-5 border-gray-300 rounded mb-2 text-gray-400 opacity-60" />
              <p className="text-sm font-medium text-gray-500 px-6">Check a student's row selector box to dynamically construct trend analysis lines.</p>
            </div>
          )}
        </div>
      </main>

      {/* CREATE & EDIT FORM DIALOGUE MODAL MODULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border max-w-2xl w-full my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-900">{editingStudentId ? 'Modify Student Marks Profile' : 'Register New Student Data Node'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Full Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Age</label>
                  <input type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Current Class</label>
                  <input type="text" required value={formData.current_class} onChange={e => setFormData({...formData, current_class: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50" placeholder="e.g. 10th Grade" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-bold text-indigo-900 mb-3">Academic Monthly Performance Scoring Matrix (0-100)</h4>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {['Telugu', 'Hindi', 'English', 'Social Studies'].map(subject => (
                    <div key={subject} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <h5 className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">{subject}</h5>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {["January", "February", "March", "April", "May", "June"].map(month => (
                          <div key={month}>
                            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{month.substring(0,3)}</label>
                            <input type="number" min="0" max="100" required value={formData.marks[subject]?.[month] || 0} onChange={e => handleMarkChange(subject, month, e.target.value)} className="w-full border p-1 rounded bg-white text-center text-xs font-semibold" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}