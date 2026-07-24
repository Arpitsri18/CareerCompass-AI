"""
Lightweight persistence layer for CareerCompass AI.

TRD specifies PostgreSQL or Firebase for user profiles. For local MVP
development (no external DB service reachable from this environment),
SQLite is used as a drop-in substitute with the same schema shape
(user_id -> profile JSON). Swapping to Postgres later only requires
replacing the functions in this file; callers (main.py) are unaffected.
"""
import json
import sqlite3
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

DB_PATH = Path(__file__).parent / "data" / "careercompass.db"
DB_PATH.parent.mkdir(exist_ok=True)


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY,
                profile_json TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def create_user_id() -> str:
    return str(uuid.uuid4())


def save_profile(user_id: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    conn = _get_conn()
    try:
        profile_json = json.dumps(profile)
        conn.execute(
            """
            INSERT INTO user_profiles (user_id, profile_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                profile_json = excluded.profile_json,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, profile_json),
        )
        conn.commit()
        return {"user_id": user_id, "saved": True}
    finally:
        conn.close()


def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT profile_json FROM user_profiles WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        if row is None:
            return None
        return json.loads(row["profile_json"])
    finally:
        conn.close()


def delete_profile(user_id: str) -> bool:
    conn = _get_conn()
    try:
        cur = conn.execute("DELETE FROM user_profiles WHERE user_id = ?", (user_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()
