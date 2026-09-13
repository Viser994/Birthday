def test_ready_does_not_need_a_key(client):
    response = client.get("/v1/ready")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_payments_require_api_key(client, sample_payment):
    response = client.post("/v1/payments", json=sample_payment)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_create_payment_succeeds(client, auth_headers, sample_payment):
    response = client.post("/v1/payments", json=sample_payment, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "completed"
    assert body["rtr_status"] == "ACSC"
    assert body["amount"] == "25.00"
    assert body["currency"] == "CAD"
    assert body["reference"] == "INV-1001"
    assert body["identifiers"]["tracking_number"]
    assert body["identifiers"]["rail_reference"]
    assert body["payer"]["name"] == "Jane Doe"
    assert body["payee"]["account"] == "WALLET-2002"


def test_bearer_auth_works(client, sample_payment):
    headers = {"Authorization": "Bearer maple_sandbox_dev_key", "Content-Type": "application/json"}
    response = client.post("/v1/payments", json=sample_payment, headers=headers)
    assert response.status_code == 201


def test_invalid_amount(client, auth_headers, sample_payment):
    sample_payment["amount"] = "25.001"
    response = client.post("/v1/payments", json=sample_payment, headers=auth_headers)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_REQUEST"


def test_usd_rejected(client, auth_headers, sample_payment):
    sample_payment["currency"] = "USD"
    response = client.post("/v1/payments", json=sample_payment, headers=auth_headers)
    assert response.status_code == 400


def test_same_account_rejected(client, auth_headers, sample_payment):
    sample_payment["payee"]["account"] = sample_payment["payer"]["account"]
    response = client.post("/v1/payments", json=sample_payment, headers=auth_headers)
    assert response.status_code == 400


def test_reject_outcome(client, auth_headers, sample_payment):
    sample_payment["payee"]["account"] = "REJECT-99"
    response = client.post("/v1/payments", json=sample_payment, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "rejected"
    assert body["rtr_status"] == "RJCT"
    assert body["reject_reason"]["code"] == "AC01"


def test_pending_outcome(client, auth_headers, sample_payment):
    sample_payment["test_outcome"] = "pending"
    response = client.post("/v1/payments", json=sample_payment, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["identifiers"]["rail_reference"] is None


def test_get_and_list(client, auth_headers, sample_payment):
    created = client.post("/v1/payments", json=sample_payment, headers=auth_headers).json()
    fetched = client.get(f"/v1/payments/{created['id']}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["id"] == created["id"]

    listed = client.get("/v1/payments", headers=auth_headers).json()
    assert listed["count"] == 1


def test_unknown_payment(client, auth_headers):
    response = client.get("/v1/payments/pay_missing", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_idempotency_key_returns_same_payment(client, auth_headers, sample_payment):
    headers = {**auth_headers, "Idempotency-Key": "order-55"}
    first = client.post("/v1/payments", json=sample_payment, headers=headers).json()
    second = client.post("/v1/payments", json=sample_payment, headers=headers).json()
    assert first["id"] == second["id"]


def test_status_check_and_explain(client, auth_headers, sample_payment):
    created = client.post("/v1/payments", json=sample_payment, headers=auth_headers).json()
    checked = client.post(f"/v1/payments/{created['id']}/status-check", headers=auth_headers)
    assert checked.status_code == 200
    assert checked.json()["status"] == "completed"

    explained = client.get(f"/v1/payments/{created['id']}/rtr", headers=auth_headers).json()
    assert explained["rtr_request"]["app_header"]["message_definition_identifier"] == "pacs.008.001.08"
    assert explained["rtr_status_message"]["document"]["fi_to_fi_payment_status_report"]
    assert explained["status_enquiry"]["app_header"]["message_definition_identifier"] == "pacs.028.001.03"
    assert explained["field_guide"]
