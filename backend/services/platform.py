import re
from urllib.parse import urlparse

ALLOWED_DOMAINS = {
    "tiktok.com": "tiktok",
    "vm.tiktok.com": "tiktok",
    "vt.tiktok.com": "tiktok",
    "m.tiktok.com": "tiktok",
    "www.tiktok.com": "tiktok",
    "instagram.com": "instagram",
    "www.instagram.com": "instagram",
    "instagr.am": "instagram",
}


def detect_platform(url: str) -> str | None:
    """Returns 'tiktok' or 'instagram' or None if unsupported."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        return ALLOWED_DOMAINS.get(domain)
    except Exception:
        return None


def validate_url(url: str) -> tuple[bool, str | None]:
    """Returns (is_valid, platform_or_none)"""
    platform = detect_platform(url)
    if not platform:
        return False, None
    return True, platform
