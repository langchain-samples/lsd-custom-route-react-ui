"""Supabase JWT auth for LangGraph custom route deployment.

Validates the Bearer token against Supabase's /auth/v1/user endpoint
and scopes resources per authenticated user.
"""

import os

import httpx
from langgraph_sdk import Auth
from langgraph_sdk.auth import is_studio_user

auth = Auth()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_PUBLISHABLE_DEFAULT_KEY = os.environ.get("SUPABASE_PUBLISHABLE_DEFAULT_KEY", "")

_http_client = httpx.AsyncClient()


@auth.authenticate
async def get_current_user(
    authorization: str | None,
) -> Auth.types.MinimalUserDict:
    """Validate Supabase JWT and return user identity."""
    if not authorization or not authorization.startswith("Bearer "):
        raise Auth.exceptions.HTTPException(
            status_code=401, detail="Missing or invalid authorization header"
        )

    token = authorization.removeprefix("Bearer ").strip()

    response = await _http_client.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": SUPABASE_PUBLISHABLE_DEFAULT_KEY,
        },
    )

    if response.status_code != 200:
        raise Auth.exceptions.HTTPException(
            status_code=401, detail="Invalid or expired token"
        )

    user = response.json()
    return {
        "identity": user["id"],
        "display_name": user.get("email", ""),
    }


@auth.on
async def add_owner(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Scope all resources to the authenticated user."""
    if is_studio_user(ctx.user):
        return {}

    filters = {"owner": ctx.user.identity}
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)
    return filters
