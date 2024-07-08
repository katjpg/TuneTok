import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
OPEN_AI_KEY = os.getenv("OPEN_AI_SECRET_KEY")
SUNO_COOKIE = os.getenv("SUNO_COOKIE")

# Constants
KEYFRAME_PROMPT = """Analyze each keyframe comprehensively using the following steps. 
Your final answer should just be a labeled, 2-3 sentence description for each keyframe, 
starting with 'Keyframe X:' where X is the keyframe number. 
Step 1: Provide a brief overview of the entire scene, including the setting and general composition.
Step 2: Identify and list the main subjects, objects, or people present in the image.
Step 3: Describe any actions, interactions, or movements occurring within the scene.
Step 4: Highlight any notable details, unusual elements, or subtle nuances that contribute to the image's uniqueness.
Step 5: Interpret the overall mood, atmosphere, or emotional tone conveyed by the image.
Step 6: If applicable, comment on the artistic style, lighting, color palette, or photographic techniques used.
Step 7: Suggest any potential symbolism, themes, or messages that might be present in the image.
"""

SUNO_PROMPT_TEMPLATE = """
Generate a concise summary (max 200 characters) combining keyframe descriptions and transcription.
Then, assign a music genre and style based on the scene's mood and elements.

Format your response as:
A [style] [genre] song about [summary]

Instructions:
1. Analyze all keyframe descriptions and transcription.
2. Identify key themes, mood, and notable elements.
3. Summarize in 200 characters or less.
4. Choose an appropriate music genre and style that match the overall tone.
5. Do not include explanations or additional text.
6. Ensure the final output fits the specified format.
"""

# TODO: Currently not used in the codebase; will need to integrate this 
# Model configurations
GPT_MODEL = "gpt-4o"
GPT_VISION_MODEL = "gpt-4o"
WHISPER_MODEL = "whisper-1"

# File paths
MEDIA_DIR = "media"

# Other configurations
MAX_SCENES = 3
CHUNK_SIZE = 25 * 1024 * 1024  # 25 MB for audio chunks