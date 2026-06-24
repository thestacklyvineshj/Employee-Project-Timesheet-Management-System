from datetime import datetime, date

from werkzeug.security import generate_password_hash, check_password_hash

from models.db import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="employee")

    assignments = db.relationship(
        "EmployeeProject", back_populates="employee", cascade="all, delete-orphan"
    )
    timesheets = db.relationship(
        "Timesheet", back_populates="employee", cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignments = db.relationship(
        "EmployeeProject", back_populates="project", cascade="all, delete-orphan"
    )
    timesheets = db.relationship(
        "Timesheet", back_populates="project", cascade="all, delete-orphan"
    )

    def to_dict(self, include_employee_count=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_employee_count:
            data["employee_count"] = len(self.assignments)
        return data


class EmployeeProject(db.Model):
    __tablename__ = "employee_projects"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    employee = db.relationship("User", back_populates="assignments")
    project = db.relationship("Project", back_populates="assignments")

    __table_args__ = (
        db.UniqueConstraint("employee_id", "project_id", name="uq_employee_project"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "project_id": self.project_id,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "employee_name": self.employee.name if self.employee else None,
            "employee_email": self.employee.email if self.employee else None,
            "project_name": self.project.name if self.project else None,
            "project_status": self.project.status if self.project else None,
        }


class Timesheet(db.Model):
    __tablename__ = "timesheets"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    work_date = db.Column(db.Date, nullable=False)
    hours_logged = db.Column(db.Float, nullable=False)
    task_description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employee = db.relationship("User", back_populates="timesheets")
    project = db.relationship("Project", back_populates="timesheets")

    __table_args__ = (
        db.Index("ix_timesheets_employee_date", "employee_id", "work_date"),
        db.Index("ix_timesheets_project", "project_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "project_id": self.project_id,
            "work_date": self.work_date.isoformat() if isinstance(self.work_date, date) else self.work_date,
            "hours_logged": self.hours_logged,
            "task_description": self.task_description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "employee_name": self.employee.name if self.employee else None,
            "project_name": self.project.name if self.project else None,
        }
