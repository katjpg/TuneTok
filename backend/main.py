import asyncio
import os
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uuid
import time

from models import VideoIdRequest, VideoProcessingResponse, GenerateRequest, GenerateResponse
from helper import (
    has_speech,
    transcribe_audio,
    extract_keyframes,
    generate_keyframe_desc,
    generate_prompt,
    combine_audio
)
from suno_client import create_suno_client
from config import OPEN_AI_KEY, SUNO_COOKIE

# Check for API keys
if not OPEN_AI_KEY:
    raise ValueError("OpenAI API key not found. Please set the OPEN_AI_SECRET_KEY environment variable.")
if not SUNO_COOKIE:
    raise ValueError("Suno cookie not found. Please set the SUNO_COOKIE environment variable.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Three main endpoints
# Flow: upload_video -> process_video -> generate_song 

# Upload a video file to the server
@app.post("/upload_video")
async def upload_video(file: UploadFile = File()):
    try:
        video_id = str(uuid.uuid4())
        video_dir = f"media/{video_id}"
        os.makedirs(video_dir, exist_ok=True)
        
        file_location = f"{video_dir}/{video_id}.mp4"
                
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
                
        return {"message": "Video uploaded successfully", "video_id": video_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Process the uploaded video
@app.post("/process_video", response_model=VideoProcessingResponse)
async def process_video(request: VideoIdRequest):
    video_id = request.video_id
    start_time = time.time()
    
    try:
        has_speech_result = await asyncio.to_thread(has_speech, video_id)
        
        transcription = None
        if has_speech_result:
            transcription = await transcribe_audio(video_id)
        
        keyframe_paths = await asyncio.to_thread(extract_keyframes, video_id)
        
        keyframe_analysis = await generate_keyframe_desc(video_id, keyframe_paths)

        # Generate Suno prompt
        suno_prompt = await generate_prompt(keyframe_analysis, transcription)

        end_time = time.time()
        processing_time = end_time - start_time

        response = VideoProcessingResponse(
            message=f"Video processing completed in {processing_time:.2f} seconds",
            has_speech=has_speech_result,
            transcription=transcription,
            keyframe_analysis=keyframe_analysis,
            suno_prompt=suno_prompt,
        )

        print(f"Video {video_id} processed in {processing_time:.2f} seconds")

        return response
    
    except Exception as e:
        end_time = time.time()
        processing_time = end_time - start_time
        error_message = f"An error occurred during video processing: {str(e)}. Processing time: {processing_time:.2f} seconds"
        print(error_message)
        raise HTTPException(status_code=500, detail=error_message)

# Generate a song based on the processed video
@app.post("/generate", response_model=GenerateResponse)
async def generate_song(request: GenerateRequest):
    video_id = request.video_id
    suno_prompt = request.suno_prompt
    start_time = time.time()

    try:
        suno_client = create_suno_client()

        # Generate the song using Suno AI
        clips = await asyncio.to_thread(
            suno_client.generate,
            prompt=suno_prompt,
            is_custom=False,
            wait_audio=True,
            make_instrumental=True
        )

        if not clips:
            raise HTTPException(status_code=500, detail="Failed to generate song")

        # Get the first clip (assuming we only want one song)
        clip = clips[0]

        # Create the suno_output directory
        output_dir = f"media/{video_id}/suno_output"
        os.makedirs(output_dir, exist_ok=True)

        # Download the song
        file_path = await asyncio.to_thread(suno_client.download, song=clip.id)
        print(f"Song downloaded to: {file_path}")

        # Move the downloaded file to the desired location
        song_path = f"{output_dir}/generated_song.mp3"
        os.rename(file_path, song_path)

        end_time = time.time()
        processing_time = end_time - start_time

        response = GenerateResponse(
            message=f"Song generated and downloaded successfully in {processing_time:.2f} seconds",
            song_path=song_path
        )

        print(f"Song for video {video_id} generated and moved to {song_path} in {processing_time:.2f} seconds")

        return response

    except Exception as e:
        end_time = time.time()
        processing_time = end_time - start_time
        error_message = f"An error occurred during song generation: {str(e)}. Processing time: {processing_time:.2f} seconds"
        print(error_message)
        raise HTTPException(status_code=500, detail=error_message)