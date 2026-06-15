import os

# Ensure the FastAPI app can be imported in test environments without a real
# production JWT secret. This must run before `app.main` is imported.
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "dev-test-secret-key-at-least-32-characters-long",
)
