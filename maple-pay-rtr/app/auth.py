from fastapi import Header, HTTPException, status

from .config import get_settings


def require_api_key(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> str:
    """Accept either X-API-Key or Authorization: Bearer <key>."""
    expected = get_settings().api_key
    provided = (x_api_key or "").strip()
    if not provided and authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer":
            provided = token.strip()
        else:
            provided = authorization.strip()
    if provided != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Send your sandbox key in X-API-Key or Authorization: Bearer <key>.",
                "hint": f"Local default key is {expected}",
            },
        )
    return provided
