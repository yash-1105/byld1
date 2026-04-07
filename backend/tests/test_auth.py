import uuid

TEST_PASSWORD = "Str0ngPass!"
TEST_NAME = "Test User"


def _email() -> str:
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


async def _register(client, email: str):
    resp = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": TEST_PASSWORD,
        "full_name": TEST_NAME,
        "role": "architect",
    })
    return resp


async def test_register(client):
    email = _email()
    resp = await _register(client, email)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == email
    assert body["meta"] == {}


async def test_register_duplicate(client):
    email = _email()
    await _register(client, email)
    resp = await _register(client, email)
    assert resp.status_code == 400
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "email_already_registered"


async def test_login(client):
    email = _email()
    await _register(client, email)
    resp = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": TEST_PASSWORD,
    })
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "access_token" in data
    assert "refresh_token" in data


async def test_login_wrong_password(client):
    email = _email()
    await _register(client, email)
    resp = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "wrong",
    })
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "invalid_credentials"


async def test_me(client):
    email = _email()
    reg = await _register(client, email)
    access_token = reg.json()["data"]["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == email
    assert resp.json()["meta"] == {}


async def test_me_no_token(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.json()["success"] is False
    assert resp.json()["error"]["code"] == "invalid_credentials"


async def test_refresh(client):
    email = _email()
    reg = await _register(client, email)
    old_access = reg.json()["data"]["access_token"]
    refresh_token = reg.json()["data"]["refresh_token"]
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    new_data = resp.json()["data"]
    assert "access_token" in new_data
    assert new_data["access_token"] != old_access


async def test_logout(client):
    email = _email()
    reg = await _register(client, email)
    access_token = reg.json()["data"]["access_token"]
    refresh_token = reg.json()["data"]["refresh_token"]
    resp = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    refresh = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh.status_code == 401
