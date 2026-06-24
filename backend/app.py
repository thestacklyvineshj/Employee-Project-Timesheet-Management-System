from flask import Flask
from flask_cors import CORS

from config import Config
from models.db import db
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.employees import employees_bp
from routes.timesheets import timesheets_bp
from routes.dashboard import dashboard_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(projects_bp, url_prefix="/api")
    app.register_blueprint(employees_bp, url_prefix="/api")
    app.register_blueprint(timesheets_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
