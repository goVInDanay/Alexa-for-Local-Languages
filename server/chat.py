import os 
import sys
import json
import io

import paramiko
from dotenv import load_dotenv
load_dotenv()

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def process_transcript(transcript, language):
    # creating client
    import google.generativeai as genai

    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)

    # Create the model
    generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
    }

    model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    # safety_settings = Adjust safety settings
    # See https://ai.google.dev/gemini-api/docs/safety-settings
    )

    chat_session = model.start_chat(
    history=[]
    )

    message = f"answer in {language} (do not use any special symbols like *,^,(,), etc.) , {transcript}"
    response_gemini = chat_session.send_message(message)
    processed_text = response_gemini.text
    return processed_text


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python chat.py <transcript>")
        sys.exit(1)

    transcript = sys.argv[1]
    language = sys.argv[2]
    
    processed_text = process_transcript(transcript, language)
    # Print processed text as JSON
    print(json.dumps({"processedText": processed_text}))