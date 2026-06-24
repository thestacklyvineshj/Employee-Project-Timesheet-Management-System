import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function TimesheetMonitoring() {
  const [timesheets, setTimesheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ employee_id: '', project_id: '', from: '', to: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTimesheets = (page = 1, params = filters) => {
    setLoading(true);
    const query = new URLSearchParams({ page, per_page: 10 });
    if (params.employee_id) query.set('employee_id', params.employee_id);
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);

    api.get(`/timesheets?${query.toString()}`)
      .then((res) => {
        setTimesheets(res.data.timesheets);
        setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load timesheets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([api.get('/employees'), api.get('/projects')]).then(([empRes, projRes]) => {
      setEmployees(empRes.data.employees);
      setProjects(projRes.data.projects);
    });
    loadTimesheets();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadTimesheets(1, filters);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timesheet entry?')) return;
    try {
      await api.delete(`/timesheets/${id}`);
      loadTimesheets(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <h2 className="page-title">Timesheet Monitoring</h2>

      <div className="card filter-bar">
        <form onSubmit={handleFilter} className="filter-form">
          <div className="form-group">
            <label>Employee</label>
            <select value={filters.employee_id} onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}>
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Project</label>
            <select value={filters.project_id} onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}>
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>From</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary">Filter</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : timesheets.length === 0 ? (
          <p className="empty-state">No timesheets found.</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Project</th>
                  <th>Hours</th>
                  <th>Task</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.work_date}</td>
                    <td>{t.employee_name}</td>
                    <td>{t.project_name}</td>
                    <td>{t.hours_logged}</td>
                    <td>{t.task_description}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <span>{pagination.total} total entries</span>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadTimesheets(pagination.page - 1)}
                >
                  Previous
                </button>
                <span>Page {pagination.page} of {pagination.pages}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadTimesheets(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
