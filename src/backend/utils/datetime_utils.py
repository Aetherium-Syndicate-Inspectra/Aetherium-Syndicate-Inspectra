from datetime import datetime, timezone

def now_iso() -> str:
    """Return the current UTC time in ISO format."""
    return datetime.now(tz=timezone.utc).isoformat()
