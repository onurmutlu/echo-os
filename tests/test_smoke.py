import asyncio
from fastapi.testclient import TestClient
from echo_os.app import app
from echo_os.store import init_db


def test_health():
    c = TestClient(app)
    r = c.get("/health")
    assert r.status_code == 200 and r.json()["ok"] is True


def test_plan_and_log():
    # Initialize database before test
    asyncio.run(init_db())

    c = TestClient(app)
    # plan endpoint without real OpenAI (monkeypatch later or rely on key)
    r = c.post(
        "/api/log",
        json={"code": "ECHO.LOG/002", "title": "Resonance", "content": "warm fractal"},
    )
    assert r.status_code == 200
    r2 = c.get("/api/log")
    assert r2.status_code == 200 and isinstance(r2.json(), list)
