# helper_email.py
def send_reset_email(to_email: str, reset_link: str):
    print(f"Sending email to {to_email}")
    print(f"Reset your password here: {reset_link}")
