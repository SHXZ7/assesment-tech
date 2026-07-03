from app.auth.jwt_handler import create_access_token, extract_user
from app.auth.password import hash_password, verify_password


def test_hash_password_does_not_store_plain_text():
    hashed_password = hash_password("employee123")

    assert hashed_password != "employee123"
    assert verify_password("employee123", hashed_password)
    assert not verify_password("wrong-password", hashed_password)


def test_jwt_extracts_safe_user_payload():
    token = create_access_token(
        {
            "sub": "employee@test.com",
            "role": "employee",
            "id": "64abc123",
        }
    )

    assert extract_user(token) == {
        "email": "employee@test.com",
        "role": "employee",
        "id": "64abc123",
    }
