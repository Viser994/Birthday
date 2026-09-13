def test_heartbeat(client, auth_headers):
    response = client.get("/v1/health", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["event_code"] == "HBRT"
    assert body["acknowledged"] is True


def test_balance(client, auth_headers):
    response = client.get("/v1/balance", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["currency"] == "CAD"
    assert body["query_name"] == "GETACCT"


def test_sandbox_page(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Maple Pay RTR" in response.text
