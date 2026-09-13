from app.config import Settings
from app.rtr import build_pacs008, infer_outcome


def test_pacs008_uses_simple_fields():
    settings = Settings()
    payment = {
        "id": "pay_test",
        "amount": "10.00",
        "currency": "CAD",
        "payer": {"name": "A", "account": "A1"},
        "payee": {"name": "B", "account": "B1"},
        "reference": "INV-1",
        "uetr": "11111111-1111-1111-1111-111111111111",
        "trace_id": "trace",
        "business_message_identifier": "BIZ1",
        "message_identification": "P81",
        "created_at": "2026-09-13T12:00:00.000Z",
    }
    message = build_pacs008(payment, settings)
    tx = message["document"]["fi_to_fi_customer_credit_transfer"]["credit_transfer_transaction_information"]
    assert tx["payment_type_information"]["local_instrument"]["proprietary"] == "RTREXCHANGE"
    assert tx["interbank_settlement_amount"] == {"amount": "10.00", "currency": "CAD"}
    assert tx["debtor"]["name"] == "A"
    assert tx["creditor_account"]["identification"]["other"]["identification"] == "B1"
    assert message["http_headers"]["x-uetr"] == payment["uetr"]


def test_infer_outcome_from_account():
    assert infer_outcome({"payee": {"account": "REJECT-1"}, "test_outcome": None}) == "rejected"
    assert infer_outcome({"payee": {"account": "PENDING-1"}, "test_outcome": None}) == "pending"
    assert infer_outcome({"payee": {"account": "WALLET-2"}, "test_outcome": None}) == "success"
    assert infer_outcome({"payee": {"account": "WALLET-2"}, "test_outcome": "rejected"}) == "rejected"
