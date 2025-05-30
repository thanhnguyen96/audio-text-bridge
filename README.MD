# Audio Text Bridge

Audio Text Bridge is a Node.js application that provides functionalities for:

1. **Speech-to-Text (STT):** Transcribing audio files into text using Google's Gemini API.  
2. **Text-to-Speech (TTS):** Converting text files into spoken audio (MP3) using Microsoft Edge's online TTS services via `edge-tts-node`.

The application offers both a web interface for individual file processing and a command-line interface (CLI) for batch processing. It can also be run using Docker and Docker Compose.

---

## Features

- **Web Interface:**
  - Upload an audio file (MP3, WAV, FLAC, M4A, OGG) to get its transcription.
  - Upload a text file (.txt) to generate an MP3 audio file.
  - User-friendly interface with loading indicators and error messages.

- **Command-Line Interface (CLI):**
  - Batch process audio files from a specified input directory for STT.
  - Batch process text files from a specified input directory for TTS.

- **Secure API Key Handling:** Uses `.env` file for API key management.

- **Dockerized:** Includes `Dockerfile` and `docker-compose.yml` for easy containerization and deployment.

- **Organized File Structure:** Clear separation of concerns for public assets, server logic, and data.

---

## Folder Structure

```
audio-text-bridge/
├── data/
│   ├── speech-to-text/
│   │   ├── input/
│   │   └── output/
│   └── text-to-speech/
│       ├── input/
│       └── output/
├── node_modules/
├── patches/
├── public/
│   ├── index.html
│   └── script.js
├── uploads/
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── index.js
├── package-lock.json
├── package.json
└── README.md
```

---

## Prerequisites

- Node.js (version 20.x or later recommended)
- npm (usually comes with Node.js)
- Google Gemini API Key for Speech-to-Text
- (Optional) Docker and Docker Compose for containerized deployment

---

## Setup

1. **Clone the repository (if applicable):**

    ```bash
    git clone https://github.com/thanhnguyen96/audio-text-bridge.git
    cd audio-text-bridge
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Copy the example `.env` file:

    ```bash
    cp .env.example .env
    ```

    Then edit the `.env` file:

    ```env
    GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY
    PORT=3000  # Optional: specify a port for the web server
    ```

4. **Create necessary data directories (if not using Docker volumes initially):**

    ```bash
    mkdir -p data/speech-to-text/input
    mkdir -p data/speech-to-text/output
    mkdir -p data/text-to-speech/input
    mkdir -p data/text-to-speech/output
    mkdir -p uploads
    ```

---

## Running the Application

### 1. Web Server

To start the web server:

```bash
npm start
```

The server will typically run on [http://localhost:3000](http://localhost:3000) or the port specified in your `.env` file.

---

### 2. Command-Line Interface (CLI)

#### Speech-to-Text (STT)

1. Place your audio files (e.g., `.mp3`, `.wav`) into:

    ```
    data/speech-to-text/input/
    ```

2. Run the STT script:

    ```bash
    npm run stt
    ```

3. Transcriptions will be saved in:

    ```
    data/speech-to-text/output/
    ```

#### Text-to-Speech (TTS)

1. Place your `.txt` files into:

    ```
    data/text-to-speech/input/
    ```

2. Run the TTS script:

    ```bash
    npm run tts
    ```

3. Generated audio files will be saved in:

    ```
    data/text-to-speech/output/
    ```

---

## Running with Docker

### 1. Using Docker Compose (Recommended)

Ensure your `.env` file is configured.

Build and start the services:

```bash
docker-compose up --build
```

Add `-d` to run in detached mode:

```bash
docker-compose up --build -d
```

The application will be accessible at:

```
http://localhost:<PORT>
```

Uploaded files and generated TTS audio will persist in `app_uploads` and `app_tts_output` on your host machine.

To stop the services:

```bash
docker-compose down
```

---

### 2. Using Docker CLI (Manual)

Build the Docker image:

```bash
docker build -t audio-text-bridge .
```

Run the Docker container:

```bash
docker run -p 3000:3000   -e GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"   -e PORT=3000   -v ./app_uploads:/usr/src/app/uploads   -v ./app_tts_output:/usr/src/app/data/text-to-speech/output   --name my-audio-app   audio-text-bridge
```

Replace `YOUR_ACTUAL_GEMINI_API_KEY` with your actual key. Adjust the host port if needed.

---

## Technologies Used

- **Backend:** Node.js, Express.js  
- **Speech-to-Text:** Google Generative AI (Gemini)  
- **Text-to-Speech:** `edge-tts-node` (Microsoft Edge TTS)  
- **File Uploads:** Multer  
- **Environment Variables:** dotenv  
- **Containerization:** Docker, Docker Compose  
- **Frontend:** HTML, CSS, Vanilla JavaScript  

---

## Contributing

Contributions are welcome! Please submit a pull request or open an issue.

---

## License

This project is licensed under the MIT License.