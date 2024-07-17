import asyncio
import base64
import cv2
import moviepy.editor as mp
import numpy as np
import os
import torch
from typing import List, Optional
import aiohttp
from scipy.signal import find_peaks
from scipy.io import wavfile
import tempfile
from pydub import AudioSegment
import moviepy.editor as mpe
from suno import Suno, ModelVersions
from openai import AsyncOpenAI

from models import KeyframeAnalysis
from config import OPEN_AI_KEY, KEYFRAME_PROMPT, SUNO_PROMPT_TEMPLATE


# Clients
client = AsyncOpenAI(api_key=OPEN_AI_KEY)


# Speech detection
def has_speech(video_id: str) -> bool:
    video_path = f"media/{video_id}/{video_id}.mp4"
    try:
        video = mp.VideoFileClip(video_path)
        audio_path = f"media/{video_id}/{video_id}.wav"
        video.audio.write_audiofile(audio_path, codec='pcm_s16le')
        video.close()

        model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad')
        (get_speech_timestamps, _, read_audio, _, _) = utils

        wav = read_audio(audio_path, sampling_rate=16000)
        speech_timestamps = get_speech_timestamps(wav, model, sampling_rate=16000)

        os.remove(audio_path)

        return len(speech_timestamps) > 0

    except Exception as e:
        print(f"Error in speech detection: {str(e)}")
        return False

# Audio extraction
def extract_audio(video_id: str) -> str:
    video_path = f"media/{video_id}/{video_id}.mp4"
    video = mp.VideoFileClip(video_path)
    audio_path = f"media/{video_id}/{video_id}.wav"
    video.audio.write_audiofile(audio_path, codec='pcm_s16le')
    video.close()
    return audio_path

# Transcribe Audio
async def transcribe_audio(video_id: str) -> str:
    video_path = f"media/{video_id}/{video_id}.mp4"
    
    if not await asyncio.to_thread(has_speech, video_id):
        return "No speech detected in the video."

    try:
        audio_path = await asyncio.to_thread(extract_audio, video_id)

        chunk_size = 25 * 1024 * 1024  # 25 MB chunks
        audio = AudioSegment.from_wav(audio_path)
        duration_ms = len(audio)

        async def transcribe_chunk(chunk):
            chunk_path = f"temp_chunk_{chunk.frame_count()}.wav"
            chunk.export(chunk_path, format="wav")
            
            try:
                with open(chunk_path, "rb") as audio_file:
                    transcription = await client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                return transcription.text
            finally:
                os.remove(chunk_path)

        chunks = [audio[i:i+chunk_size] for i in range(0, duration_ms, chunk_size)]
        transcriptions = await asyncio.gather(*[transcribe_chunk(chunk) for chunk in chunks])

        full_transcription = " ".join(transcriptions)

        os.remove(audio_path)

        return full_transcription

    except Exception as e:
        return f"Error in transcription: {str(e)}"
    
# Keyframe extraction via Mean Color Histogram
def calculate_color_histogram(frame: np.ndarray) -> np.ndarray:
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    hist = cv2.calcHist([rgb_frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    return cv2.normalize(hist, hist).flatten().astype(np.float32)

def histogram_difference(hist1: np.ndarray, hist2: np.ndarray) -> float:
    return cv2.compareHist(hist1, hist2, cv2.HISTCMP_CHISQR)

def extract_keyframes(video_id: str, max_scenes: int = 3) -> List[str]:
    video_path = f"media/{video_id}/{video_id}.mp4"
    video = cv2.VideoCapture(video_path)
    
    frames = []
    while True:
        ret, frame = video.read()
        if not ret:
            break
        frames.append(frame)
    
    video.release()
    
    if len(frames) < max_scenes:
        keyframes = frames
    else:
        step = len(frames) // max_scenes
        keyframes = [frames[i] for i in range(0, len(frames), step)][:max_scenes]
    
    keyframe_paths = []
    for i, frame in enumerate(keyframes):
        path = f"media/{video_id}/keyframe_{i+1}.jpg"
        cv2.imwrite(path, frame)
        keyframe_paths.append(path)
    
    return keyframe_paths

# Generate Keyframe Descriptions
async def generate_keyframe_desc(video_id: str, keyframe_paths: List[str]) -> List[KeyframeAnalysis]:
    async def process_images(keyframe_paths: List[str]) -> List[KeyframeAnalysis]:
        content = [{"type": "text", "text": KEYFRAME_PROMPT}]
        
        for i, path in enumerate(keyframe_paths, 1):
            with open(path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                })
            content.append({"type": "text", "text": f"This is keyframe_{i}."})

        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": content
                }
            ],
            "max_tokens": 1000  # Increased for multiple images
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPEN_AI_KEY}", "Content-Type": "application/json"},
                    json=payload
                ) as response:
                    result = await response.json()
                    
                    if 'choices' not in result or not result['choices']:
                        raise ValueError(f"Unexpected API response: {result}")
                    
                    full_description = result['choices'][0]['message']['content']
                    
                    # Split the description for each keyframe
                    keyframe_descriptions = full_description.split("Keyframe")[1:]  # Remove the first split which is empty
                    
                    return [
                        KeyframeAnalysis(
                            frame=f"keyframe_{i}",
                            path=path,
                            description=desc.strip()
                        )
                        for i, (path, desc) in enumerate(zip(keyframe_paths, keyframe_descriptions), 1)
                    ]
        except Exception as e:
            print(f"Error processing images: {str(e)}")
            return [
                KeyframeAnalysis(
                    frame=f"keyframe_{i}",
                    path=path,
                    description="Error generating description"
                )
                for i, path in enumerate(keyframe_paths, 1)
            ]

    return await process_images(keyframe_paths)

# Suno Prompt Generation
def combine_keyframe_descriptions(keyframe_analysis: List[KeyframeAnalysis]) -> str:
    """Combine all keyframe descriptions into a single string."""
    return "\n".join([kf.description for kf in keyframe_analysis])

def create_full_content(keyframe_descriptions: str, transcription: Optional[str]) -> str:
    """Combine keyframe descriptions and transcription if available."""
    if transcription:
        return f"{keyframe_descriptions}\n\nTranscription: {transcription}"
    return keyframe_descriptions

async def generate_prompt(keyframe_analysis: List[KeyframeAnalysis], transcription: Optional[str]) -> str:
    """Generate a prompt for Suno based on keyframe analysis and transcription."""
    keyframe_descriptions = combine_keyframe_descriptions(keyframe_analysis)
    full_content = create_full_content(keyframe_descriptions, transcription)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",  
            messages=[
                {"role": "system", "content": SUNO_PROMPT_TEMPLATE},
                {"role": "user", "content": full_content}
            ],
            max_tokens=200 
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating Suno prompt: {str(e)}")
        return "Error generating Suno prompt"
    
# Video Post Processing 
# initial function w/o finding best offset
# def combine_audio(vidname, audname, outname, fps=60):
#     # Load the video clip
#     my_clip = mpe.VideoFileClip(vidname)
    
#     # Load the audio clip
#     audio_background = mpe.AudioFileClip(audname)
    
#     # Get the duration of the video
#     video_duration = my_clip.duration
    
#     # Trim the audio to match the video duration
#     trimmed_audio = audio_background.subclip(0, video_duration)
    
#     # Set the trimmed audio to the video clip
#     final_clip = my_clip.set_audio(trimmed_audio)
    
#     # Write the final video file
#     final_clip.write_videofile(outname, fps=fps)
    
#     # Close the clips to free up resources
#     my_clip.close()
#     audio_background.close()
#     final_clip.close()

def analyze_video_changes(video):
    # Extract frames and convert to grayscale
    frames = [np.mean(frame) for frame in video.iter_frames()]
    
    # Calculate frame differences
    diffs = np.diff(frames)
    
    # Find peaks in frame differences
    peaks, _ = find_peaks(np.abs(diffs), height=np.std(diffs))
    
    return peaks / video.fps

def analyze_audio_energy(audio, chunk_size=1000):
    # Save audio to a temporary file
    temp_dir = tempfile.mkdtemp()
    temp_audio_path = os.path.join(temp_dir, 'temp_audio.wav')
    audio.write_audiofile(temp_audio_path, codec='pcm_s16le')
    
    # Read the audio file
    sample_rate, samples = wavfile.read(temp_audio_path)
    
    # Convert to mono if stereo
    if len(samples.shape) > 1:
        samples = np.mean(samples, axis=1)
    
    # Calculate energy in chunks
    num_chunks = len(samples) // chunk_size
    energy = np.array([np.mean(samples[i*chunk_size:(i+1)*chunk_size]**2) for i in range(num_chunks)])
    
    # Find peaks in energy
    peaks, _ = find_peaks(energy, height=np.mean(energy))
    
    # Clean up
    os.remove(temp_audio_path)
    os.rmdir(temp_dir)
    
    return peaks * (chunk_size / sample_rate)

def combine_audio(vidname, audname, outname, fps=60):
    # Load the video clip
    my_clip = mpe.VideoFileClip(vidname)
    
    # Load the audio clip
    audio_background = mpe.AudioFileClip(audname)
    
    # Get the duration of the video
    video_duration = my_clip.duration
    
    # Analyze video changes
    video_changes = analyze_video_changes(my_clip)
    
    # Analyze audio energy
    audio_peaks = analyze_audio_energy(audio_background)
    
    # Find the best offset for the audio
    best_offset = 0
    best_score = float('inf')
    for offset in np.arange(0, max(0, audio_background.duration - video_duration), 0.5):
        score = np.sum(np.min(np.abs(video_changes[:, np.newaxis] - (audio_peaks - offset)), axis=1))
        if score < best_score:
            best_score = score
            best_offset = offset
    
    # Trim and offset the audio
    trimmed_audio = audio_background.subclip(best_offset, best_offset + video_duration)
    
    # Set the trimmed audio to the video clip
    final_clip = my_clip.set_audio(trimmed_audio)
    
    # Write the final video file
    final_clip.write_videofile(outname, fps=fps)
    
    # Close the clips to free up resources
    my_clip.close()
    audio_background.close()
    final_clip.close()
