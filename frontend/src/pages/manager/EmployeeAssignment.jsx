import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function EmployeeAssignment() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ employee_id: '', project_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/employees'),
      api.get('/projects'),
      api.get('/employee-projects'),
    ])
      .then(([empRes, projRes, assignRes]) => {
        setEmployees(empRes.data.employees);
        setProjects(projRes.data.projects.filter((p) => p.status === 'active'));
        setAssignments(assignRes.data.assignments);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.employee_id || !form.project_id) {
      setError('Please select both employee and project');
      return;
    }

    setSaving(true);
    try {
      await api.post('/assign-project', {
        employee_id: parseInt(form.employee_id, 10),
        project_id: parseInt(form.project_id, 10),
      });
      setSuccess('Employee assigned successfully');
      setForm({ employee_id: '', project_id: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await api.delete(`/unassign-project/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unassign');
    }
  };

  return (
    <div>
      <h2 className="page-title">Employee Assignment</h2>

      <div className="card form-card">
        <h3>Assign Employee to Project</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleAssign} className="filter-form">
          <div className="form-group">
            <label>Employee</label>
            <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Project</label>
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Current Assignments</h3>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : assignments.length === 0 ? (
          <p className="empty-state">No assignments yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Project</th>
                <th>Status</th>
                <th>Assigned On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.employee_name}</td>
                  <td>{a.project_name}</td>
                  <td><span className={`badge badge-${a.project_status}`}>{a.project_status}</span></td>
                  <td>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleUnassign(a.id)}>Unassign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
