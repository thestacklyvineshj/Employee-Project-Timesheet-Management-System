from datetime import datetime

from flask import Blueprint, request, jsonify, g

from models.db import db
from models.models import Timesheet, EmployeeProject
from utils.auth_utils import token_required, manager_required, employee_required

timesheets_bp = Blueprint("timesheets", __name__)


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _validate_timesheet_data(data, require_all=True):
    errors = []
    project_id = data.get("project_id")
    work_date = data.get("work_date")
    hours_logged = data.get("hours_logged")
    task_description = (data.get("task_description") or "").strip()

    if require_all or "project_id" in data:
        if not project_id:
            errors.append("project_id is required")
    if require_all or "work_date" in data:
        if not work_date:
            errors.append("work_date is required")
        elif not _parse_date(work_date):
            errors.append("work_date must be YYYY-MM-DD")
    if require_all or "hours_logged" in data:
        if hours_logged is None:
            errors.append("hours_logged is required")
        else:
            try:
                hours = float(hours_logged)
                if hours < 0.1 or hours > 24:
                    errors.append("hours_logged must be between 0.1 and 24")
            except (TypeError, ValueError):
                errors.append("hours_logged must be a number")
    if require_all or "task_description" in data:
        if not task_description:
            errors.append("task_description is required")

    return errors


def _check_assignment(employee_id, project_id):
    return EmployeeProject.query.filter_by(
        employee_id=employee_id, project_id=project_id
    ).first()


@timesheets_bp.route("/timesheets", methods=["POST"])
@employee_required
def create_timesheet():
    data = request.get_json() or {}
    errors = _validate_timesheet_data(data)
    if errors:
        return jsonify({"error": "; ".join(errors)}), 400

    project_id = data["project_id"]
    if not _check_assignment(g.current_user.id, project_id):
        return jsonify({"error": "You are not assigned to this project"}), 403

    timesheet = Timesheet(
        employee_id=g.current_user.id,
        project_id=project_id,
        work_date=_parse_date(data["work_date"]),
        hours_logged=float(data["hours_logged"]),
        task_description=data["task_description"].strip(),
    )
    db.session.add(timesheet)
    db.session.commit()
    return jsonify({"timesheet": timesheet.to_dict()}), 201


@timesheets_bp.route("/timesheets/my", methods=["GET"])
@employee_required
def my_timesheets():
    query = Timesheet.query.filter_by(employee_id=g.current_user.id)

    project_id = request.args.get("project_id", type=int)
    from_date = _parse_date(request.args.get("from"))
    to_date = _parse_date(request.args.get("to"))

    if project_id:
        query = query.filter_by(project_id=project_id)
    if from_date:
        query = query.filter(Timesheet.work_date >= from_date)
    if to_date:
        query = query.filter(Timesheet.work_date <= to_date)

    timesheets = query.order_by(Timesheet.work_date.desc()).all()
    return jsonify({"timesheets": [t.to_dict() for t in timesheets]})


@timesheets_bp.route("/timesheets", methods=["GET"])
@manager_required
def list_timesheets():
    query = Timesheet.query

    employee_id = request.args.get("employee_id", type=int)
    project_id = request.args.get("project_id", type=int)
    from_date = _parse_date(request.args.get("from"))
    to_date = _parse_date(request.args.get("to"))
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    if employee_id:
        query = query.filter_by(employee_id=employee_id)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if from_date:
        query = query.filter(Timesheet.work_date >= from_date)
    if to_date:
        query = query.filter(Timesheet.work_date <= to_date)

    per_page = min(max(per_page, 1), 100)
    pagination = query.order_by(Timesheet.work_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "timesheets": [t.to_dict() for t in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": per_page,
        "pages": pagination.pages,
    })


@timesheets_bp.route("/timesheets/<int:timesheet_id>", methods=["PUT"])
@token_required
def update_timesheet(timesheet_id):
    timesheet = db.session.get(Timesheet, timesheet_id)
    if not timesheet:
        return jsonify({"error": "Timesheet not found"}), 404

    user = g.current_user
    if user.role == "employee" and timesheet.employee_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json() or {}
    errors = _validate_timesheet_data(data, require_all=False)
    if errors:
        return jsonify({"error": "; ".join(errors)}), 400

    if "project_id" in data and data["project_id"]:
        project_id = data["project_id"]
        emp_id = timesheet.employee_id if user.role == "manager" else user.id
        if not _check_assignment(emp_id, project_id):
            return jsonify({"error": "Employee is not assigned to this project"}), 403
        timesheet.project_id = project_id

    if "work_date" in data and data["work_date"]:
        timesheet.work_date = _parse_date(data["work_date"])
    if "hours_logged" in data and data["hours_logged"] is not None:
        timesheet.hours_logged = float(data["hours_logged"])
    if "task_description" in data:
        desc = (data["task_description"] or "").strip()
        if not desc:
            return jsonify({"error": "task_description is required"}), 400
        timesheet.task_description = desc

    db.session.commit()
    return jsonify({"timesheet": timesheet.to_dict()})


@timesheets_bp.route("/timesheets/<int:timesheet_id>", methods=["DELETE"])
@token_required
def delete_timesheet(timesheet_id):
    timesheet = db.session.get(Timesheet, timesheet_id)
    if not timesheet:
        return jsonify({"error": "Timesheet not found"}), 404

    user = g.current_user
    if user.role == "employee" and timesheet.employee_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    db.session.delete(timesheet)
    db.session.commit()
    return jsonify({"message": "Timesheet deleted successfully"})
