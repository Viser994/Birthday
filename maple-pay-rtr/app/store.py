import json
import sqlite3
import threading
from pathlib import Path
from typing import Any


class PaymentStore:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        if db_path != ":memory:":
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init()

    def _init(self) -> None:
        with self._conn:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    idempotency_key TEXT UNIQUE,
                    payload TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )

    def create(self, payment: dict[str, Any], idempotency_key: str | None = None) -> dict[str, Any]:
        with self._lock, self._conn:
            if idempotency_key:
                existing = self._conn.execute(
                    "SELECT payload FROM payments WHERE idempotency_key = ?",
                    (idempotency_key,),
                ).fetchone()
                if existing:
                    return json.loads(existing["payload"])
            self._conn.execute(
                "INSERT INTO payments (id, idempotency_key, payload, created_at) VALUES (?, ?, ?, ?)",
                (payment["id"], idempotency_key, json.dumps(payment), payment["created_at"]),
            )
        return payment

    def get(self, payment_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT payload FROM payments WHERE id = ?",
                (payment_id,),
            ).fetchone()
        return json.loads(row["payload"]) if row else None

    def get_by_idempotency(self, key: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT payload FROM payments WHERE idempotency_key = ?",
                (key,),
            ).fetchone()
        return json.loads(row["payload"]) if row else None

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT payload FROM payments ORDER BY created_at DESC"
            ).fetchall()
        return [json.loads(row["payload"]) for row in rows]

    def update(self, payment_id: str, **fields: Any) -> dict[str, Any] | None:
        with self._lock, self._conn:
            row = self._conn.execute(
                "SELECT payload FROM payments WHERE id = ?",
                (payment_id,),
            ).fetchone()
            if not row:
                return None
            payment = json.loads(row["payload"])
            payment.update(fields)
            self._conn.execute(
                "UPDATE payments SET payload = ? WHERE id = ?",
                (json.dumps(payment), payment_id),
            )
        return payment

    def close(self) -> None:
        self._conn.close()
