# Employee Project & Timesheet Management System

A full-stack web application built with React, Flask, and MySQL for managing employee work hours, project assignments, and productivity reporting.

## Features

- Role-based access control with separate employee and manager dashboards
- Project CRUD for managers
- Employee assignment and unassignment for managers
- Timesheet submission with validation for employees
- Timesheet monitoring with filters and pagination for managers
- Reports with bar/pie charts and top-5 active employees
- JWT-based authentication and protected routes

## Screenshots

### Authentication
![Login page](screenshots/01-login.png)

### Employee Dashboard
![Employee dashboard with weekly/monthly hours and recent timesheets](screenshots/02-employee-dashboard.png)

![Submit timesheet form](screenshots/03-submit-timesheet.png)

![Timesheet history with filters](screenshots/04-timesheet-history.png)

### Manager Dashboard
![Manager dashboard with summary stats](screenshots/05-manager-dashboard.png)

![Project management CRUD](screenshots/06-project-management.png)

![Employee project assignments](screenshots/07-employee-assignment.png)

![Timesheet monitoring with filters and pagination](screenshots/08-timesheet-monitoring.png)

![Reports with bar chart, pie chart, and top employees](screenshots/09-reports.png)

## Tech Stack

- Frontend: React 18, React Router v6, Axios, Recharts, Vite
- Backend: Flask, Flask-SQLAlchemy, Flask-CORS, PyJWT
- Database: MySQL 8+
- Styling: Custom CSS

## Folder Structure

```text
timesheet-app/
├── screenshots/
│   ├── 01-login.png
│   ├── 02-employee-dashboard.png
│   ├── 03-submit-timesheet.png
│   ├── 04-timesheet-history.png
│   ├── 05-manager-dashboard.png
│   ├── 06-project-management.png
│   ├── 07-employee-assignment.png
│   ├── 08-timesheet-monitoring.png
│   └── 09-reports.png
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── seed.py
│   ├── requirements.txt
│   ├── models/
│   │   ├── db.py
│   │   └── models.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── projects.py
│   │   ├── timesheets.py
│   │   ├── dashboard.py
│   │   └── employees.py
│   └── utils/
│       └── auth_utils.py
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── components/common/
        │   └── Layout.jsx
        └── pages/
            ├── auth/
            ├── employee/
            └── manager/
```

## Prerequisites

- Python 3.9+
- Node.js 18+
- MySQL 8.0+

## Database Setup

```sql
CREATE DATABASE timesheet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tsuser'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON timesheet_db.* TO 'tsuser'@'localhost';
FLUSH PRIVILEGES;
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Then edit `.env` and set:

```env
DATABASE_URL=mysql+pymysql://tsuser:yourpassword@localhost/timesheet_db
JWT_SECRET_KEY=your-secure-secret
JWT_EXPIRY_HOURS=24
FLASK_ENV=development
```

Run backend:

```bash
python app.py
```

Seed demo data:

```bash
python seed.py
```

Backend URL: `http://localhost:5000`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@demo.com | manager123 |
| Employee | bob@demo.com | employee123 |
| Employee | carol@demo.com | employee123 |
| Employee | david@demo.com | employee123 |

## API Endpoints

### Authentication

- `POST /api/register`
- `POST /api/login`
- `GET /api/logout`
- `GET /api/profile`

### Projects

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects` (manager)
- `PUT /api/projects/:id` (manager)
- `DELETE /api/projects/:id` (manager)

### Assignments

- `POST /api/assign-project` (manager)
- `GET /api/employee-projects` (auth)
- `DELETE /api/unassign-project/:id` (manager)

### Timesheets

- `POST /api/timesheets` (employee)
- `GET /api/timesheets/my` (employee)
- `GET /api/timesheets` (manager)
- `PUT /api/timesheets/:id` (employee/manager)
- `DELETE /api/timesheets/:id` (employee/manager)

### Dashboard

- `GET /api/dashboard/employee` (employee)
- `GET /api/dashboard/manager` (manager)

## Write-Up Answers

### 1) Database Relationships

- Users and projects are many-to-many via `employee_projects`.
- Users to timesheets is one-to-many.
- Projects to timesheets is one-to-many.
- Assignment rows enforce that employees can only log time to assigned projects.

### 2) Role-Based Access Control

- JWT stores `user_id` and `role`.
- Backend decorators:
  - `@token_required` validates token.
  - `@manager_required` validates manager role.
- Frontend route guard redirects users away from unauthorized sections.

### 3) Preventing Employee Access to Manager Pages

- Frontend blocks via `ProtectedRoute`.
- Backend blocks manager routes with `@manager_required` and returns HTTP 403.

### 4) Timesheet Validation

- Required: `project_id`, `work_date`, `hours_logged`, `task_description`.
- `hours_logged` must be within `0.1` to `24`.
- Employee must be assigned to the target project.
- Validation exists on both frontend and backend.

### 5) First Refactor for Scale (10,000 employees)

The manager dashboard aggregate queries are the first optimization target. For scale, use pre-aggregated metrics (stats table or cache) and index-heavy query paths, especially:

- `timesheets(employee_id, work_date)`
- `timesheets(project_id)`

## Manual Verification Checklist

1. Register as a new employee and confirm redirect to employee dashboard.
2. Login as manager and verify manager pages are accessible.
3. Login as employee and verify manager routes are blocked.
4. Submit a valid timesheet and verify it appears in history.
5. Attempt invalid hours (`0` or `25`) and verify validation errors.
6. Assign/unassign users as manager and verify assignment list changes.
7. Verify reports render bar and pie charts using seeded data.
