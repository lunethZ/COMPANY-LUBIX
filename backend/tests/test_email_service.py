import pytest
from unittest.mock import patch, MagicMock
from app.services.email.EmailService import send_email
from app.Config import config


@patch("app.services.email.EmailService.smtplib.SMTP")
def test_send_email_happy_path(mock_smtp):
    mock_instance = MagicMock()
    mock_smtp.return_value = mock_instance

    result = send_email(
        to_email="test@example.com",
        subject="Test subject",
        body="<b>Test body</b>"
    )

    assert result is True
    mock_instance.starttls.assert_called_once()
    mock_instance.login.assert_called_once()
    mock_instance.send_message.assert_called_once()
    mock_instance.quit.assert_called_once()


@patch("app.services.email.EmailService.smtplib.SMTP")
def test_send_email_smtp_error(mock_smtp):
    import smtplib
    mock_smtp.side_effect = smtplib.SMTPException("Auth failed")

    result = send_email(
        to_email="test@example.com",
        subject="Test subject",
        body="<b>Test body</b>"
    )

    assert result is False