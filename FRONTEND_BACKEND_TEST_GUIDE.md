# Frontend-Backend Test Guide

This guide verifies real backend/database behavior (no mock data).

## 1) Start backend

Use a terminal in `D:/Resume_Builder`:

```powershell
$env:SECRET_KEY = "your-real-dev-secret"
uvicorn app.main:app --reload
```

## 2) Configure frontend API URL

Set `VITE_API_BASE_URL` to backend URL.

Example (`.env` in frontend root):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 3) Register

Call `apiService.register` with:

```ts
{ email: "you@example.com", password: "StrongPass123!", name: "Your Name" }
```

Expected:
- HTTP `200`
- JSON with envelope:
  - `status: "success"`
  - `data.access_token`
  - `data.token_type`

## 4) Login

Call `apiService.login`:

```ts
{ email: "you@example.com", password: "StrongPass123!" }
```

Expected:
- HTTP `200` for valid credentials
- HTTP `401` for invalid credentials
- JSON response body (no Python objects)

## 5) Test DB insert endpoint

Call `apiService.testDbInsert`:

```ts
{ email: "dbcheck@example.com", password: "StrongPass123!", name: "DB Check" }
```

Expected:
- HTTP `200`
- JSON envelope:
  - `status: "success"`
  - `data.user_id`
  - `data.email`
- A second call with same email returns HTTP `400`

## 6) CORS checks

Frontend origins allowed:
- `http://localhost:3000`
- `http://localhost:5173`

If browser blocks requests, confirm the app is running with latest backend code and that requests target the same backend URL as `VITE_API_BASE_URL`.

## 7) Headers

JSON endpoints should send/receive JSON:
- `Content-Type: application/json`
- `Accept: application/json`
