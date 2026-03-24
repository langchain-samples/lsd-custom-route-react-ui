"""Local SQLite + JWT auth for LangGraph custom route deployment.

Uses a local SQLite database for user storage and PyJWT for token
generation/validation. Scopes resources per authenticated user.
"""

import hashlib
import hmac
import os
import sqlite3
import uuid

import jwt
from langgraph_sdk import Auth

auth = Auth()

JWT_SECRET = os.environ.get("JWT_SECRET", "local-dev-secret-change-me-in-production")
JWT_ALGORITHM = "HS256"
DB_PATH = os.environ.get("AUTH_DB_PATH", "users.db")


def _get_db() -> sqlite3.Connection:
    """Get a SQLite connection, creating the users table if needed."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )"""
    )
    conn.commit()
    return conn


def _hash_password(password: str) -> str:
    """Hash a password with a random salt using SHA-256."""
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex() + ":" + pw_hash.hex()


def _verify_password(password: str, stored: str) -> bool:
    """Verify a password against the stored hash."""
    salt_hex, hash_hex = stored.split(":")
    salt = bytes.fromhex(salt_hex)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return hmac.compare_digest(pw_hash.hex(), hash_hex)


def create_user(email: str, password: str) -> dict:
    """Create a new user and return a JWT."""
    db = _get_db()
    user_id = str(uuid.uuid4())
    password_hash = _hash_password(password)
    try:
        db.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
            (user_id, email, password_hash),
        )
        db.commit()
    except sqlite3.IntegrityError:
        raise ValueError("A user with this email already exists.")
    finally:
        db.close()

    token = jwt.encode(
        {"sub": user_id, "email": email}, JWT_SECRET, algorithm=JWT_ALGORITHM
    )
    return {"token": token, "user": {"id": user_id, "email": email}}


def login_user(email: str, password: str) -> dict:
    """Authenticate a user and return a JWT."""
    db = _get_db()
    row = db.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?", (email,)
    ).fetchone()
    db.close()

    if not row or not _verify_password(password, row[2]):
        raise ValueError("Invalid email or password.")

    token = jwt.encode(
        {"sub": row[0], "email": row[1]}, JWT_SECRET, algorithm=JWT_ALGORITHM
    )
    return {"token": token, "user": {"id": row[0], "email": row[1]}}


@auth.authenticate
async def get_current_user(
    authorization: str | None,
) -> Auth.types.MinimalUserDict:
    """Validate local JWT and return user identity."""
    if not authorization or not authorization.startswith("Bearer "):
        raise Auth.exceptions.HTTPException(
            status_code=401, detail="Missing or invalid authorization header"
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise Auth.exceptions.HTTPException(
            status_code=401, detail="Invalid or expired token"
        )

    return {
        "identity": payload["sub"],
        "display_name": payload.get("email", ""),
    }


@auth.on
async def add_owner(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Scope all resources to the authenticated user."""
    filters = {"owner": ctx.user.identity}
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)
    return filters
