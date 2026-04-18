"""
app.py — Flask application for the Tamil AI Travel Planner NLP service.
"""

from flask import Flask, request, jsonify
from main import process_text
from transcribe import transcribe_from_bytes
from api_service import get_real_travel_options

app = Flask(__name__)

# Maximum audio file size: 10 MB
MAX_AUDIO_SIZE = 10 * 1024 * 1024


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/nlp")
def nlp():
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "Request body must be JSON with a 'text' field"}), 400

    text = data["text"]
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "'text' must be a non-empty string"}), 400

    result = process_text(text.strip())
    return jsonify(result)


@app.post("/transcribe")
def transcribe():
    """
    Accepts an audio file upload and returns Tamil speech-to-text transcription.
    Uses local OpenAI Whisper model (no API key required).

    Expects multipart form data with field name 'audio'.
    Returns JSON: { text, language, confidence, duration }
    """
    # Check if audio file was uploaded
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided. Use field name 'audio'."}), 400

    audio_file = request.files["audio"]

    if audio_file.filename == "":
        return jsonify({"error": "Empty audio file"}), 400

    # Read audio bytes
    audio_bytes = audio_file.read()

    # Validate file size
    if len(audio_bytes) == 0:
        return jsonify({"error": "Audio file is empty. தயவுசெய்து மீண்டும் பேசுங்கள்."}), 400

    if len(audio_bytes) > MAX_AUDIO_SIZE:
        return jsonify({"error": "Audio file too large. Maximum 10MB allowed."}), 413

    # Determine audio format from filename
    filename = audio_file.filename or "audio.webm"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    supported_formats = {"webm", "wav", "mp3", "ogg", "m4a", "flac"}
    if ext not in supported_formats:
        ext = "webm"  # Default to webm (browser recording format)

    # Get language parameter (default: Tamil)
    language = request.form.get("language", "ta")

    try:
        result = transcribe_from_bytes(audio_bytes, language=language, audio_format=ext)

        # Check for empty transcription
        if not result.get("text", "").strip():
            return jsonify({
                "error": "குரல் கேட்கவில்லை, மீண்டும் முயற்சிக்கவும்",
                "text": "",
                "language": language,
                "confidence": 0,
                "duration": result.get("duration", 0),
            }), 200

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Transcription failed: {str(e)}")
        return jsonify({
            "error": f"குரல் அங்கீகாரம் தோல்வியடைந்தது: {str(e)}"
        }), 500


@app.post("/travel-options")
def travel_options():
    try:
        data = request.get_json(silent=True)
        source = data.get("source", "")
        destination = data.get("destination", "")
        budget = data.get("budget", "medium")
        
        if not source or not destination:
            return jsonify({"error": "Source and destination required"}), 400
            
        options = get_real_travel_options(source, destination, budget)
        return jsonify(options), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
