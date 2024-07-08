import requests
import time
import os

# For testing purposes; synchronous script
# Base URL for server
BASE_URL = "http://localhost:8000"  

def upload_video(video_path):
    """Upload a video file to the server."""
    with open(video_path, "rb") as video_file:
        files = {"file": (os.path.basename(video_path), video_file, "video/mp4")}
        response = requests.post(f"{BASE_URL}/upload_video", files=files)
    
    if response.status_code == 200:
        return response.json()["video_id"]
    else:
        raise Exception(f"Failed to upload video: {response.text}")

def process_video(video_id):
    """Process the uploaded video."""
    response = requests.post(f"{BASE_URL}/process_video", json={"video_id": video_id})
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to process video: {response.text}")

def generate_song(video_id, suno_prompt):
    """Generate a song based on the processed video."""
    response = requests.post(f"{BASE_URL}/generate", json={"video_id": video_id, "suno_prompt": suno_prompt})
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to generate song: {response.text}")

def main():
    # Testing an mp4 file!
    video_path = "./media/test-vids/test.mp4"
    
    try:
        # Step 1: Upload the video
        print("Uploading video...")
        video_id = upload_video(video_path)
        print(f"Video uploaded successfully. Video ID: {video_id}")
        
        # Step 2: Process the video
        print("Processing video...")
        process_result = process_video(video_id)
        print("Video processed successfully.")
        print(f"Transcription: {process_result.get('transcription', 'No transcription available')}")
        print(f"Suno Prompt: {process_result['suno_prompt']}")
        
        # Step 3: Generate the song
        # print("Generating song...")
        # song_result = generate_song(video_id, process_result['suno_prompt'])
        # print(f"Song generated successfully. Path: {song_result['song_path']}")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()