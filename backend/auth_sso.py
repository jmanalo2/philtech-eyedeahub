"""
Azure AD / Microsoft Entra ID SSO Authentication Module.

Validates Azure AD tokens and provides SSO login flow for the Eye-dea application.
Follows the same pattern used in Albertsons internal apps (SDIM Impact, etc.).
"""

import os
import logging
from typing import Optional
from datetime import datetime, timezone

import httpx
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Azure AD / Entra ID Configuration (loaded from environment)
AZURE_TENANT_ID = os.environ.get("AZURE_TENANT_ID", "")
AZURE_CLIENT_ID = os.environ.get("AZURE_CLIENT_ID", "")
AZURE_AUTHORITY = os.environ.get(
    "AZURE_AUTHORITY",
    f"https://login.microsoftonline.com/{AZURE_TENANT_ID}" if AZURE_TENANT_ID else ""
)
AZURE_ISSUER = os.environ.get(
    "AZURE_ISSUER",
    f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/v2.0" if AZURE_TENANT_ID else ""
)

# JWKS endpoint for token signature verification
AZURE_JWKS_URI = os.environ.get(
    "AZURE_JWKS_URI",
    f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys" if AZURE_TENANT_ID else ""
)

# Role mapping from Azure AD groups/roles to app roles
# Format: { "azure_group_id_or_role_name": "app_role" }
# These can be configured via environment or left to default mapping
AZURE_ADMIN_GROUP_IDS = os.environ.get("AZURE_ADMIN_GROUP_IDS", "").split(",")
AZURE_APPROVER_GROUP_IDS = os.environ.get("AZURE_APPROVER_GROUP_IDS", "").split(",")

# SSO Feature flag
SSO_ENABLED = os.environ.get("SSO_ENABLED", "true").lower() == "true"

# Dev mode fallback flag - when True, allows local login alongside SSO
DEV_MODE_LOGIN_ENABLED = os.environ.get("DEV_MODE_LOGIN_ENABLED", "false").lower() == "true"

# Cached JWKS keys
_jwks_cache: Optional[dict] = None
_jwks_cache_time: Optional[datetime] = None
JWKS_CACHE_DURATION_SECONDS = 3600  # 1 hour


async def get_azure_jwks() -> dict:
    """Fetch and cache Azure AD JWKS (JSON Web Key Set) for token verification."""
    global _jwks_cache, _jwks_cache_time

    now = datetime.now(timezone.utc)

    if (
        _jwks_cache is not None
        and _jwks_cache_time is not None
        and (now - _jwks_cache_time).total_seconds() < JWKS_CACHE_DURATION_SECONDS
    ):
        return _jwks_cache

    if not AZURE_JWKS_URI:
        raise HTTPException(
            status_code=500,
            detail="Azure AD JWKS URI not configured. Set AZURE_TENANT_ID or AZURE_JWKS_URI."
        )

    async with httpx.AsyncClient() as client:
        response = await client.get(AZURE_JWKS_URI)
        if response.status_code != 200:
            logger.error(f"Failed to fetch JWKS: {response.status_code}")
            raise HTTPException(status_code=500, detail="Failed to fetch Azure AD signing keys")
        _jwks_cache = response.json()
        _jwks_cache_time = now

    return _jwks_cache


def _get_signing_key(token: str, jwks: dict) -> dict:
    """Extract the correct signing key from JWKS based on token header."""
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token header")

    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Token missing key ID")

    for key in jwks.get("keys", []):
        if key["kid"] == kid:
            return key

    raise HTTPException(status_code=401, detail="Token signing key not found in Azure AD JWKS")


async def validate_azure_token(token: str) -> dict:
    """
    Validate an Azure AD access token or ID token.

    Returns the decoded token claims if valid.
    Raises HTTPException if invalid.
    """
    if not SSO_ENABLED:
        raise HTTPException(status_code=400, detail="SSO is not enabled")

    if not AZURE_CLIENT_ID or not AZURE_TENANT_ID:
        raise HTTPException(
            status_code=500,
            detail="Azure AD configuration incomplete. Set AZURE_TENANT_ID and AZURE_CLIENT_ID."
        )

    jwks = await get_azure_jwks()
    signing_key = _get_signing_key(token, jwks)

    try:
        # Decode and validate the token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=AZURE_CLIENT_ID,
            issuer=AZURE_ISSUER,
            options={
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": True,
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTClaimsError as e:
        logger.warning(f"Token claims error: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token claims: {str(e)}")
    except JWTError as e:
        logger.warning(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


def extract_user_info_from_claims(claims: dict) -> dict:
    """
    Extract user information from Azure AD token claims.

    Standard claims from Azure AD ID tokens:
    - preferred_username: user's email/UPN
    - name: display name
    - given_name: first name
    - family_name: last name
    - oid: object ID (unique user identifier in Azure AD)
    - groups: list of group IDs (if configured in app registration)
    - roles: list of app roles (if configured)
    """
    return {
        "email": claims.get("preferred_username") or claims.get("email") or claims.get("upn", ""),
        "first_name": claims.get("given_name", ""),
        "last_name": claims.get("family_name", ""),
        "display_name": claims.get("name", ""),
        "azure_oid": claims.get("oid", ""),
        "groups": claims.get("groups", []),
        "roles": claims.get("roles", []),
    }


def determine_app_role(user_info: dict) -> str:
    """
    Determine the application role based on Azure AD claims.

    Priority:
    1. Azure AD App Roles (if 'roles' claim is present)
    2. Azure AD Group membership
    3. Default to 'user'

    To configure:
    - Set AZURE_ADMIN_GROUP_IDS with comma-separated Azure AD group IDs for admin users
    - Set AZURE_APPROVER_GROUP_IDS for approver users
    - Or configure App Roles in Azure AD app registration with values: "admin", "approver", "user"
    """
    # Check app roles first (configured in Azure AD App Registration > App Roles)
    roles = user_info.get("roles", [])
    if "admin" in roles:
        return "admin"
    if "approver" in roles:
        return "approver"

    # Check group membership
    groups = user_info.get("groups", [])
    if groups:
        admin_groups = [g.strip() for g in AZURE_ADMIN_GROUP_IDS if g.strip()]
        approver_groups = [g.strip() for g in AZURE_APPROVER_GROUP_IDS if g.strip()]

        if any(g in admin_groups for g in groups):
            return "admin"
        if any(g in approver_groups for g in groups):
            return "approver"

    return "user"
