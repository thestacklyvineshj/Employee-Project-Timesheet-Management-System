from flask import Blueprint, request, jsonify, g

from models.db import db
from models.models import Project
from utils.auth_utils import token_required, manager_required

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/projects", methods=["GET"])
@token_required
def list_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    include_count = g.current_user.role == "manager"
    return jsonify({
        "projects": [p.to_dict(include_employee_count=include_count) for p in projects]
    })


@projects_bp.route("/projects/<int:project_id>", methods=["GET"])
@token_required
def get_project(project_id):
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    data = project.to_dict(include_employee_count=True)
    data["employees"] = [a.to_dict() for a in project.assignments]
    return jsonify({"project": data})


@projects_bp.route("/projects", methods=["POST"])
@manager_required
def create_project():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    status = (data.get("status") or "active").strip().lower()

    if not name:
        return jsonify({"error": "Project name is required"}), 400
    if status not in ("active", "completed"):
        return jsonify({"error": "Status must be active or completed"}), 400

    project = Project(name=name, description=description, status=status)
    db.session.add(project)
    db.session.commit()
    return jsonify({"project": project.to_dict(include_employee_count=True)}), 201


@projects_bp.route("/projects/<int:project_id>", methods=["PUT"])
@manager_required
def update_project(project_id):
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if name:
        project.name = name
    if "description" in data:
        project.description = (data.get("description") or "").strip()
    if "status" in data:
        status = (data.get("status") or "").strip().lower()
        if status not in ("active", "completed"):
            return jsonify({"error": "Status must be active or completed"}), 400
        project.status = status

    db.session.commit()
    return jsonify({"project": project.to_dict(include_employee_count=True)})


@projects_bp.route("/projects/<int:project_id>", methods=["DELETE"])
@manager_required
def delete_project(project_id):
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted successfully"})
