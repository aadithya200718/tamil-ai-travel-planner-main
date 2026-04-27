"""
transcribe.py — Whisper-based Tamil speech-to-text transcription service.
Uses OpenAI Whisper (local, self-hosted) for Tamil language transcription.
"""

import whisper
import os
import tempfile
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Whisper model (base model for balance between speed and accuracy)
# Options: tiny, base, small, medium, large
# base = 74MB, small = 244MB
MODEL_SIZE = os.getenv('WHISPER_MODEL_SIZE', 'tiny')
logger.info(f"Loading Whisper model: {MODEL_SIZE}")
logger.info("Whisper model loaded successfully")
torch.set_num_threads(1)
 


def transcribe_audio(audio_file_path, language='ta'):
    """
    Transcribe audio file to text using Whisper.
    
    Args:
        audio_file_path (str): Path to audio file
        language (str): Language code (default: 'ta' for Tamil)
    
    Returns:
        dict: {
            'text': str,           # Transcribed text
            'language': str,       # Detected/specified language
            'confidence': float,   # Average confidence (if available)
            'duration': float      # Audio duration in seconds
        }
    """
    try:
        logger.info(f"Transcribing audio file: {audio_file_path}")
        
        # Transcribe with Whisper
        result = model.transcribe(
            audio_file_path,
            language=language,
            task='transcribe',
            fp16=False,  # Use FP32 for CPU compatibility
            verbose=False
        )
        
        text = result['text'].strip()
        detected_language = result.get('language', language)
        
        # Calculate average confidence from segments if available
        segments = result.get('segments', [])
        if segments:
            confidences = [seg.get('no_speech_prob', 0) for seg in segments]
            avg_confidence = 1 - (sum(confidences) / len(confidences))
        else:
            avg_confidence = 0.0
        
        logger.info(f"Transcription successful: '{text[:50]}...'")
        logger.info(f"Detected language: {detected_language}, Confidence: {avg_confidence:.2f}")
        
        return {
            'text': text,
            'language': detected_language,
            'confidence': avg_confidence,
            'duration': result.get('duration', 0)
        }
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise


def save_uploaded_file(file_data, suffix='.webm'):
    """
    Save uploaded file data to a temporary file.
    
    Args:
        file_data (bytes): Audio file data
        suffix (str): File extension
    
    Returns:
        str: Path to temporary file
    """
    try:
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_file.write(file_data)
        temp_file.close()
        
        logger.info(f"Saved uploaded file to: {temp_file.name}")
        return temp_file.name
        
    except Exception as e:
        logger.error(f"Error saving uploaded file: {str(e)}")
        raise


def cleanup_temp_file(file_path):
    """
    Delete temporary file.
    
    Args:
        file_path (str): Path to file to delete
    """
    try:
        if file_path and os.path.exists(file_path):
            os.unlink(file_path)
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.warning(f"Error cleaning up file {file_path}: {str(e)}")


def transcribe_from_bytes(audio_bytes, language='ta', audio_format='webm'):
    """
    Transcribe audio from bytes data.
    
    Args:
        audio_bytes (bytes): Audio file data
        language (str): Language code
        audio_format (str): Audio format (webm, wav, mp3, etc.)
    
    Returns:
        dict: Transcription result
    """
    temp_file = None
    try:
        # Save to temporary file
        suffix = f'.{audio_format}' if not audio_format.startswith('.') else audio_format
        temp_file = save_uploaded_file(audio_bytes, suffix=suffix)
        
        # Transcribe
        result = transcribe_audio(temp_file, language=language)
        
        return result
        
    finally:
        # Always clean up temporary file
        if temp_file:
            cleanup_temp_file(temp_file)
