from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import get_settings

import bcrypt

# JWT config
ALGORITHM = "HS256"
security = HTTPBearer()


class TokenData(BaseModel):
    user_id: int
    username: str
    type: str  # "access" or "refresh"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_token(user_id: int, username: str, token_type: str = "access") -> tuple[str, int]:
    """
    Create a JWT token.
    
    Args:
        user_id: User ID
        username: Username
        token_type: "access" or "refresh"
    
    Returns:
        Tuple of (token, expires_in_seconds)
    """
    settings = get_settings()
    
    # Token expiration
    if token_type == "access":
        expires_in = 3600  # 1 hour
    else:
        expires_in = 604800  # 7 days
    
    expire = datetime.now(UTC) + timedelta(seconds=expires_in)
    
    to_encode = {
        "user_id": user_id,
        "username": username,
        "type": token_type,
        "exp": expire,
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt, expires_in


def verify_token(token: str) -> TokenData:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        TokenData with user_id and username
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    settings = get_settings()
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        token_type: str = payload.get("type", "access")
        
        if user_id is None or username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return TokenData(user_id=user_id, username=username, type=token_type)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """
    Dependency to get the current authenticated user.
    
    Args:
        credentials: HTTP Authorization credentials
    
    Returns:
        TokenData with user information
    
    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    token_data = verify_token(token)
    
    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    
    return token_data


async def get_current_user_id(token_data: TokenData = Depends(get_current_user)) -> int:
    """Get the current user's ID."""
    return token_data.user_id
