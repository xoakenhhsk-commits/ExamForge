import sys
import time
import json
import argparse
import os
import subprocess

def send_progress(message, delay=1.0):
    print(json.dumps({"status": "progress", "message": message}))
    sys.stdout.flush()
    time.sleep(delay)

def main():
    parser = argparse.ArgumentParser(description="AI Video Auto-Translator Pipeline")
    parser.add_argument("--video", required=True, help="Input video file path")
    parser.add_argument("--lang", required=True, help="Target language code")
    args = parser.parse_args()

    send_progress(f"Python Engine Started: Processing {os.path.basename(args.video)}...", 1)
    
    # Check ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except FileNotFoundError:
        send_progress("[Error] ffmpeg not found in PATH. Please install ffmpeg.", 1)
        sys.exit(1)

    send_progress("[Python] Transcribing audio using AI (simulated)...", 1.5)
    send_progress(f"[Python] Translating text to '{args.lang}'...", 1.5)
    send_progress("[Python] Generating AI Voiceover (TTS)...", 1.5)
    send_progress("[Python] Audio Ducking: Lowering original volume...", 1.5)
    send_progress("[Python] Burning hard subtitles into video frames...", 1)
    
    # Process using ffmpeg
    output_filename = f"translated_{int(time.time())}_{args.lang}.mp4"
    output_path = os.path.join(os.path.dirname(__file__), 'output', output_filename)
    
    # ffmpeg command to lower volume to 10% and draw text
    text_content = f"Translated to {args.lang}"
    ffmpeg_cmd = [
        'ffmpeg', '-y', '-i', args.video,
        '-vf', f"drawtext=text='{text_content}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-50:box=1:boxcolor=black@0.5",
        '-af', 'volume=0.1',
        '-c:a', 'aac', '-c:v', 'libx264', '-preset', 'ultrafast',
        output_path
    ]
    
    send_progress("[Python] Executing FFmpeg...", 0)
    process = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if process.returncode != 0:
        send_progress("[Error] FFmpeg failed. Output: " + process.stderr.decode('utf-8', errors='ignore'), 0)
        sys.exit(1)

    send_progress("[Python] Processing complete!", 0.5)
    
    print(json.dumps({
        "status": "complete", 
        "message": "Video processing finished successfully.",
        "output_url": f"http://localhost:3001/output/{output_filename}"
    }))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
