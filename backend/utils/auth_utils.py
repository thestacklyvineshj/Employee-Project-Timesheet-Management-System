from datetime import datetime, timedelta
from functools import wraps

import jwt
from flask import request, jsonify, g, current_app

from models.db import db
from models.models import User


def generate_token(user):
    payload = {
        "user_id": user.id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=current_app.config["JWT_EXPIRY_HOURS"]),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])


def _authenticate():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid authorization header"}), 401

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = db.session.get(User, payload.get("user_id"))
    if not user:
        return jsonify({"error": "User not found"}), 401

    g.current_user = user
    return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        error = _authenticate()
        if error:
            return error
        return f(*args, **kwargs)

    return decorated


def manager_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        error = _authenticate()
        if error:
            return error
        if g.current_user.role != "manager":
            return jsonify({"error": "Manager access required"}), 403
        return f(*args, **kwargs)

    return decorated


def employee_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        error = _authenticate()
        if error:
            return error
        if g.current_user.role != "employee":
            return jsonify({"error": "Employee access required"}), 403
        return f(*args, **kwargs)

    return decorated
