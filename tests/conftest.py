"""Shared test helpers for Tachyon scripts."""


def _load_tachyon_core():
    """โหลด tachyon core สำหรับการทดสอบ (canonical definition)."""
    try:
        import tachyon_core
    except ImportError:
        return None
    return tachyon_core
