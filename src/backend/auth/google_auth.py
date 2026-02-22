import os
import logging
from google.oauth2 import service_account
from google.auth.exceptions import GoogleAuthError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to the Google Cloud service account credentials
CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), 'credentials.json')

def get_google_auth_credentials():
    """Authenticates with Google Cloud using service account credentials."""
    try:
        if not os.path.exists(CREDENTIALS_PATH):
            logger.error(f"Service account credentials not found at: {CREDENTIALS_PATH}")
            return None

        credentials = service_account.Credentials.from_service_account_file(CREDENTIALS_PATH)
        logger.info("Successfully authenticated with Google Cloud.")
        return credentials

    except (GoogleAuthError, IOError) as e:
        logger.error(f"Error during Google Cloud authentication: {e}")
        return None
