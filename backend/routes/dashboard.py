from datetime import date, timedelta

from flask import Blueprint, jsonify, g
from sqlalchemy import func

from models.db import db
from models.models import User, Project, EmployeeProject, Timesheet
from utils.auth_utils import employee_required, manager_required

dashboard_bp = Blueprint("dashboard", __name__)


def _week_start(today=None):
    today = today or date.today()
    return today - timedelta(days=today.weekday())


def _month_start(today=None):
    today = today or date.today()
    return today.replace(day=1)


@dashboard_bp.route("/dashboard/employee", methods=["GET"])
@employee_required
def employee_dashboard():
    user = g.current_user
    today = date.today()
    week_start = _week_start(today)
    month_start = _month_start(today)

    week_hours = (
        db.session.query(func.coalesce(func.sum(Timesheet.hours_logged), 0))
        .filter(
            Timesheet.employee_id == user.id,
            Timesheet.work_date >= week_start,
        )
        .scalar()
    )

    month_hours = (
        db.session.query(func.coalesce(func.sum(Timesheet.hours_logged), 0))
        .filter(
            Timesheet.employee_id == user.id,
            Timesheet.work_date >= month_start,
        )
        .scalar()
    )

    assigned_count = EmployeeProject.query.filter_by(employee_id=user.id).count()

    recent = (
        Timesheet.query.filter_by(employee_id=user.id)
        .order_by(Timesheet.work_date.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "week_hours": float(week_hours),
        "month_hours": float(month_hours),
        "assigned_projects": assigned_count,
        "recent_timesheets": [t.to_dict() for t in recent],
    })


@dashboard_bp.route("/dashboard/manager", methods=["GET"])
@manager_required
def manager_dashboard():
    today = date.today()
    month_start = _month_start(today)

    total_hours = (
        db.session.query(func.coalesce(func.sum(Timesheet.hours_logged), 0)).scalar()
    )
    month_hours = (
        db.session.query(func.coalesce(func.sum(Timesheet.hours_logged), 0))
        .filter(Timesheet.work_date >= month_start)
        .scalar()
    )
    active_projects = Project.query.filter_by(status="active").count()
    total_employees = User.query.filter_by(role="employee").count()

    hours_by_project = (
        db.session.query(
            Project.name,
            func.coalesce(func.sum(Timesheet.hours_logged), 0).label("hours"),
        )
        .outerjoin(Timesheet, Timesheet.project_id == Project.id)
        .group_by(Project.id, Project.name)
        .order_by(func.sum(Timesheet.hours_logged).desc())
        .all()
    )

    hours_by_employee = (
        db.session.query(
            User.name,
            func.coalesce(func.sum(Timesheet.hours_logged), 0).label("hours"),
        )
        .join(Timesheet, Timesheet.employee_id == User.id)
        .filter(User.role == "employee")
        .group_by(User.id, User.name)
        .order_by(func.sum(Timesheet.hours_logged).desc())
        .all()
    )

    top_employees = (
        db.session.query(
            User.name,
            func.coalesce(func.sum(Timesheet.hours_logged), 0).label("hours"),
        )
        .join(Timesheet, Timesheet.employee_id == User.id)
        .filter(User.role == "employee", Timesheet.work_date >= month_start)
        .group_by(User.id, User.name)
        .order_by(func.sum(Timesheet.hours_logged).desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "total_hours": float(total_hours),
        "month_hours": float(month_hours),
        "active_projects": active_projects,
        "total_employees": total_employees,
        "hours_by_project": [
            {"name": name, "hours": float(hours)} for name, hours in hours_by_project
        ],
        "hours_by_employee": [
            {"name": name, "hours": float(hours)} for name, hours in hours_by_employee
        ],
        "top_employees": [
            {"name": name, "hours": float(hours)} for name, hours in top_employees
        ],
    })
