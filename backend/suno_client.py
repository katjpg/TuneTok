from suno import Suno, ModelVersions
from dotenv import load_dotenv
import os


from config import SUNO_COOKIE
SUNO_COOKIE = os.getenv("SUNO_COOKIE")
if not SUNO_COOKIE:
    raise ValueError("Suno cookie not found. Please set the SUNO_COOKIE environment variable.")


def create_suno_client():
    return Suno(
        cookie=SUNO_COOKIE,
        model_version=ModelVersions.CHIRP_V3_5
    )