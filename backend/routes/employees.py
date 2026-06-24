from flask import Blueprint, request, jsonify, g

from models.db import db
from models.models import User, Project, EmployeeProject
from utils.auth_utils import token_required, manager_required

employees_bp = Blueprint("employees", __name__)


@employees_bp.route("/employees", methods=["GET"])
@manager_required
def list_employees():
    employees = User.query.filter_by(role="employee").order_by(User.name).all()
    return jsonify({"employees": [e.to_dict() for e in employees]})


@employees_bp.route("/assign-project", methods=["POST"])
@manager_required
def assign_project():
    data = request.get_json() or {}
    employee_id = data.get("employee_id")
    project_id = data.get("project_id")

    if not employee_id or not project_id:
        return jsonify({"error": "employee_id and project_id are required"}), 400

    employee = db.session.get(User, employee_id)
    if not employee or employee.role != "employee":
        return jsonify({"error": "Invalid employee"}), 400

    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    existing = EmployeeProject.query.filter_by(
        employee_id=employee_id, project_id=project_id
    ).first()
    if existing:
        return jsonify({"error": "Employee already assigned to this project"}), 409

    assignment = EmployeeProject(employee_id=employee_id, project_id=project_id)
    db.session.add(assignment)
    db.session.commit()
    return jsonify({"assignment": assignment.to_dict()}), 201


@employees_bp.route("/employee-projects", methods=["GET"])
@token_required
def list_employee_projects():
    query = EmployeeProject.query

    if g.current_user.role == "employee":
        query = query.filter_by(employee_id=g.current_user.id)
    else:
        employee_id = request.args.get("employee_id", type=int)
        project_id = request.args.get("project_id", type=int)
        if employee_id:
            query = query.filter_by(employee_id=employee_id)
        if project_id:
            query = query.filter_by(project_id=project_id)

    assignments = query.order_by(EmployeeProject.assigned_at.desc()).all()
    return jsonify({"assignments": [a.to_dict() for a in assignments]})


@employees_bp.route("/unassign-project/<int:assignment_id>", methods=["DELETE"])
@manager_required
def unassign_project(assignment_id):
    assignment = db.session.get(EmployeeProject, assignment_id)
    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    db.session.delete(assignment)
    db.session.commit()
    return jsonify({"message": "Employee unassigned successfully"})
