"""
Utility services for the Philtech Eye-dea application.
Contains authentication helpers, password hashing, and token creation.
"""

from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timezone, timedelta
import os

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_reset_token(email: str) -> str:
    """Create a password reset token valid for 1 hour."""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {"email": email, "exp": expire, "type": "password_reset"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def add_is_evaluated(idea: dict) -> dict:
    """Add is_evaluated computed field to idea."""
    if idea:
        idea["is_evaluated"] = bool(idea.get("is_quick_win") is not None or idea.get("complexity_level"))
    return idea
