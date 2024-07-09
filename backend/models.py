from pydantic import BaseModel
from typing import List, Optional

class VideoIdRequest(BaseModel):
    video_id: str

class KeyframeAnalysis(BaseModel):
    frame: str
    path: str
    description: str

class VideoProcessingResponse(BaseModel):
    message: str
    has_speech: bool
    transcription: Optional[str] = None
    keyframe_analysis: List[KeyframeAnalysis]
    suno_prompt: str

class GenerateRequest(BaseModel):
    video_id: str
    suno_prompt: str

class GenerateResponse(BaseModel):
    message: str
    song_path: str
    
class VideoPostProcessRequest(BaseModel):
    video_id: str

class VideoPostProcessResponse(BaseModel):
    message: str
    output_path: str