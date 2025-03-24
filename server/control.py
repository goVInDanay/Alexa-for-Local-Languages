import os 
import sys
import json
import io
import paramiko

from dotenv import load_dotenv
load_dotenv()

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def process_transcript(transcript, language):
    # Using Google LLM
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

    message = f"reply with the intent behind {transcript} in the format (device which is or can be the device associated with command, the main action verb which is asked to perform in the command ) for example the input is 'Turn on the fan' then you should reply as 'fan, on' only no other text"
    response_gemini = chat_session.send_message(message)
    intent = response_gemini.text
    send_command(os.getenv('HOSTNAME'), os.getenv('USERNAME'), os.getenv('PASSWORD'), intent)
    message = f"reply that the action asked to do so in {transcript} is being performed like if the command is 'turn on the fan' then you should reply as 'turning on the fan'"
    response_gemini = chat_session.send_message(message)
    processed_text = response_gemini.text
    return processed_text



def send_command(hostname, username, password, command):
    try:
        # Set up the SSH client
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # Connect to the Raspberry Pi
        ssh_client.connect(hostname, username=username, password=password)

        # Split the command into two parts: device and action
        parts = command.split(',')
        if len(parts) != 2:
            print("Invalid command format")
            return

        device, action = parts[0].strip(), parts[1].strip()

        # Determine the command to run based on the input
        if device.lower() == 'light' or device.lower() == 'lights':
            if action.lower() == 'off':
                gpio_command = 'python3 -c "import RPi.GPIO as GPIO; GPIO.setwarnings(False); GPIO.setmode(GPIO.BCM); GPIO.setup(14, GPIO.OUT); GPIO.output(14, GPIO.HIGH)"'
            elif action.lower() == 'on':
                gpio_command = 'python3 -c "import RPi.GPIO as GPIO; GPIO.setwarnings(False); GPIO.setmode(GPIO.BCM); GPIO.setup(14, GPIO.OUT); GPIO.output(14, GPIO.LOW)"'
            else:
                print("Unknown action for light")
                return
        elif device.lower()=='fan':
            if action.lower() == 'off':
                gpio_command = 'python3 -c "import RPi.GPIO as GPIO; GPIO.setwarnings(False); GPIO.setmode(GPIO.BCM); GPIO.setup(20, GPIO.OUT); GPIO.output(20, GPIO.HIGH)"'
            elif action.lower() == 'on':
                gpio_command = 'python3 -c "import RPi.GPIO as GPIO; GPIO.setwarnings(False); GPIO.setmode(GPIO.BCM); GPIO.setup(20, GPIO.OUT); GPIO.output(20, GPIO.LOW)"'
            else:
                print("Unknown action for fan")
                return
        else:
            print('Unknown Device')
            return

        # Execute the GPIO command over SSH
        stdin, stdout, stderr = ssh_client.exec_command(gpio_command)

        # Print any output or errors
        print(stdout.read().decode())
        print(stderr.read().decode())

    finally:
        # Close the SSH connection
        ssh_client.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python control.py <transcript>")
        sys.exit(1)
    transcript = sys.argv[1]
    language = sys.argv[2]
    
    processed_text = process_transcript(transcript, language)
    print(json.dumps({"processedText": processed_text}))