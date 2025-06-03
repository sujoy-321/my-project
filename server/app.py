from flask import Flask, request, Response
from flask_cors import CORS
import yt_dlp
import threading
import time
import os

app = Flask(__name__)
CORS(app)

current_status = {"text": "Idle"}

DOWNLOAD_DIR = os.path.join(os.path.expanduser("~"), "Downloads")

QUALITY_MAP = {
    "360p": "bestvideo[height=360]+bestaudio",
    "480p": "bestvideo[height=480]+bestaudio",
    "720p": "bestvideo[height=720]+bestaudio",
    "1080p": "bestvideo[height=1080]+bestaudio",
    "2k": "bestvideo[height=1440]+bestaudio",
    "4k": "bestvideo[height=2160]+bestaudio"
}

def progress_hook(d):
    if d['status'] == 'finished':
        current_status['text'] = '✅ Download complete'
    elif d['status'] == 'downloading':
        percent = d.get('_percent_str', '').strip()
        speed = d.get('_speed_str', '').strip()
        eta = d.get('eta', '')
        current_status['text'] = f"⬇️ {percent} at {speed}, ETA: {eta}s"

def download_video(url, quality):
    format_string = QUALITY_MAP.get(quality, QUALITY_MAP["720p"])

    current_status['text'] = '🔄 Starting download...'

    ydl_opts = {
        'format': format_string,
        'merge_output_format': 'mp4',
        'outtmpl': os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s'),
        'noplaylist': True,
        'quiet': True,
        'progress_hooks': [progress_hook],
        'force_overwrites': True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        current_status['text'] = f"❌ Error: {str(e)}"

    if "✅" not in current_status['text'] and "❌" not in current_status['text']:
        current_status['text'] = '✅ Already downloaded'

@app.route("/download", methods=["POST"])
def start_download():
    data = request.get_json()
    url = data.get("url")
    quality = data.get("quality", "720p")

    thread = threading.Thread(target=download_video, args=(url, quality))
    thread.start()

    return "Download started"

@app.route("/progress")
def progress():
    def generate():
        last = ""
        while True:
            time.sleep(1)
            if current_status['text'] != last:
                yield f"data: {current_status['text']}\n\n"
                last = current_status['text']

    return Response(generate(), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True)
