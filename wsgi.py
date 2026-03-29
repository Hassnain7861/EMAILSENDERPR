"""WSGI entry for Gunicorn (Render, Railway, etc.)."""
from flask_email_tracking.app import create_app

app = create_app()
