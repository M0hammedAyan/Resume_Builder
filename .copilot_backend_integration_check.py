from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

email = "copilot_db_test_20260417@example.com"
payload = {"email": email, "password": "StrongPass123!", "name": "DB Test User"}

# ensure clean state for deterministic duplicate check
with SessionLocal() as db:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()

resp = client.post('/test-db', json=payload)
if resp.status_code != 200:
    raise SystemExit(f"test-db insert failed: {resp.status_code} {resp.text}")
body = resp.json()
if body.get('status') != 'success':
    raise SystemExit(f"unexpected status envelope: {body}")
created_id = body.get('data', {}).get('user_id')
if not created_id:
    raise SystemExit(f"missing created user id: {body}")

with SessionLocal() as db:
    persisted = db.query(User).filter(User.id == created_id).first()
    if not persisted:
        raise SystemExit('db verification failed: user not persisted')

dup = client.post('/test-db', json=payload)
if dup.status_code != 400:
    raise SystemExit(f"duplicate handling failed: {dup.status_code} {dup.text}")

reg_email = "copilot_auth_test_20260417@example.com"
reg_payload = {"email": reg_email, "password": "StrongPass123!", "name": "Auth Test"}

with SessionLocal() as db:
    existing = db.query(User).filter(User.email == reg_email).first()
    if existing:
        db.delete(existing)
        db.commit()

reg = client.post('/auth/register', json=reg_payload)
if reg.status_code != 200:
    raise SystemExit(f"register failed: {reg.status_code} {reg.text}")
reg_body = reg.json()
token = reg_body.get('data', {}).get('access_token')
if not token:
    raise SystemExit(f"register token missing: {reg_body}")

login = client.post('/auth/login', json={"email": reg_email, "password": reg_payload['password']})
if login.status_code != 200:
    raise SystemExit(f"login failed: {login.status_code} {login.text}")

bad_login = client.post('/auth/login', json={"email": reg_email, "password": "wrong-pass-123"})
if bad_login.status_code != 401:
    raise SystemExit(f"invalid login status mismatch: {bad_login.status_code} {bad_login.text}")

cors = client.options('/auth/login', headers={
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'POST',
})
if cors.status_code not in (200, 204):
    raise SystemExit(f"CORS preflight failed: {cors.status_code} {cors.text}")
allow_origin = cors.headers.get('access-control-allow-origin')
if allow_origin != 'http://localhost:5173':
    raise SystemExit(f"CORS allow origin mismatch: {allow_origin}")

print('integration_ok test-db+auth+cors')
