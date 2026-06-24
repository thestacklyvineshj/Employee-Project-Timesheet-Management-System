import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function SubmitTimesheet() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project_id: '',
    work_date: new Date().toISOString().split('T')[0],
    hours_logged: '',
    task_description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/employee-projects').then((res) => {
      const active = res.data.assignments.filter((a) => a.project_status === 'active');
      setProjects(active);
      if (active.length > 0) {
        setForm((f) => ({ ...f, project_id: String(active[0].project_id) }));
      }
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.project_id) return 'Please select a project';
    if (!form.work_date) return 'Work date is required';
    const hours = parseFloat(form.hours_logged);
    if (isNaN(hours) || hours < 0.1 || hours > 24) return 'Hours must be between 0.1 and 24';
    if (!form.task_description.trim()) return 'Task description is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await api.post('/timesheets', {
        project_id: parseInt(form.project_id, 10),
        work_date: form.work_date,
        hours_logged: parseFloat(form.hours_logged),
        task_description: form.task_description.trim(),
      });
      setSuccess('Timesheet submitted successfully!');
      setForm({
        project_id: form.project_id,
        work_date: new Date().toISOString().split('T')[0],
        hours_logged: '',
        task_description: '',
      });
      setTimeout(() => navigate('/employee/history'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit timesheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Submit Timesheet</h2>
      <div className="card form-card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {projects.length === 0 ? (
          <p className="empty-state">No active projects assigned. Contact your manager.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="project_id">Project</label>
              <select id="project_id" name="project_id" value={form.project_id} onChange={handleChange}>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="work_date">Work Date</label>
              <input id="work_date" name="work_date" type="date" value={form.work_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="hours_logged">Hours Logged</label>
              <input id="hours_logged" name="hours_logged" type="number" step="0.1" min="0.1" max="24" value={form.hours_logged} onChange={handleChange} placeholder="e.g. 7.5" />
            </div>
            <div className="form-group">
              <label htmlFor="task_description">Task Description</label>
              <textarea id="task_description" name="task_description" rows="4" value={form.task_description} onChange={handleChange} placeholder="Describe what you worked on..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Timesheet'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
