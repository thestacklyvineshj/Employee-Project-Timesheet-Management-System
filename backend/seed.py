"""Seed demo data for Employee Project & Timesheet Management System."""

from datetime import date, timedelta

from app import create_app
from models.db import db
from models.models import User, Project, EmployeeProject, Timesheet


def seed():
    app = create_app()
    with app.app_context():
        if User.query.filter_by(email="manager@demo.com").first():
            print("Seed data already exists. Skipping.")
            return

        manager = User(name="Alice Manager", email="manager@demo.com", role="manager")
        manager.set_password("manager123")

        bob = User(name="Bob Smith", email="bob@demo.com", role="employee")
        bob.set_password("employee123")

        carol = User(name="Carol Jones", email="carol@demo.com", role="employee")
        carol.set_password("employee123")

        david = User(name="David Lee", email="david@demo.com", role="employee")
        david.set_password("employee123")

        db.session.add_all([manager, bob, carol, david])
        db.session.flush()

        projects = [
            Project(
                name="Website Redesign",
                description="Redesign company website with modern UI",
                status="active",
            ),
            Project(
                name="Mobile App",
                description="Build iOS and Android mobile application",
                status="active",
            ),
            Project(
                name="API Integration",
                description="Integrate third-party payment APIs",
                status="active",
            ),
            Project(
                name="Data Migration",
                description="Migrate legacy database to new schema",
                status="completed",
            ),
            Project(
                name="Security Audit",
                description="Annual security review and penetration testing",
                status="active",
            ),
        ]
        db.session.add_all(projects)
        db.session.flush()

        assignments = [
            EmployeeProject(employee_id=bob.id, project_id=projects[0].id),
            EmployeeProject(employee_id=bob.id, project_id=projects[1].id),
            EmployeeProject(employee_id=carol.id, project_id=projects[0].id),
            EmployeeProject(employee_id=carol.id, project_id=projects[2].id),
            EmployeeProject(employee_id=david.id, project_id=projects[1].id),
            EmployeeProject(employee_id=david.id, project_id=projects[3].id),
            EmployeeProject(employee_id=david.id, project_id=projects[4].id),
        ]
        db.session.add_all(assignments)
        db.session.flush()

        today = date.today()
        timesheet_data = [
            (bob, projects[0], today - timedelta(days=1), 6.5, "Homepage layout implementation"),
            (bob, projects[0], today - timedelta(days=3), 7.0, "CSS refactoring and responsive fixes"),
            (bob, projects[1], today - timedelta(days=2), 4.0, "Login screen UI components"),
            (bob, projects[1], today - timedelta(days=5), 8.0, "Navigation drawer setup"),
            (carol, projects[0], today - timedelta(days=1), 5.5, "Accessibility audit fixes"),
            (carol, projects[0], today - timedelta(days=4), 6.0, "Component library updates"),
            (carol, projects[2], today - timedelta(days=2), 7.5, "Stripe API integration"),
            (carol, projects[2], today - timedelta(days=6), 8.0, "Webhook handler implementation"),
            (david, projects[1], today - timedelta(days=1), 6.0, "Push notification setup"),
            (david, projects[1], today - timedelta(days=3), 5.0, "Offline sync logic"),
            (david, projects[3], today - timedelta(days=10), 8.0, "Schema mapping documentation"),
            (david, projects[4], today - timedelta(days=2), 4.5, "Vulnerability scan review"),
            (david, projects[4], today - timedelta(days=4), 7.0, "Pen test remediation"),
            (bob, projects[0], today - timedelta(days=8), 6.0, "Footer and contact page"),
            (carol, projects[2], today - timedelta(days=9), 5.5, "Payment error handling"),
            (david, projects[1], today - timedelta(days=7), 7.5, "App store build pipeline"),
            (bob, projects[1], today - timedelta(days=12), 4.0, "Unit tests for auth module"),
            (carol, projects[0], today - timedelta(days=11), 6.5, "Performance optimization"),
            (david, projects[4], today - timedelta(days=6), 5.0, "SSL certificate renewal"),
            (bob, projects[0], today, 3.5, "Bug fixes from QA feedback"),
        ]

        for employee, project, work_date, hours, desc in timesheet_data:
            db.session.add(
                Timesheet(
                    employee_id=employee.id,
                    project_id=project.id,
                    work_date=work_date,
                    hours_logged=hours,
                    task_description=desc,
                )
            )

        db.session.commit()
        print("Seed data created successfully!")
        print("Manager: manager@demo.com / manager123")
        print("Employees: bob@demo.com, carol@demo.com, david@demo.com / employee123")


if __name__ == "__main__":
    seed()
