// index.js
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs"; // Node.js File System module
import path from "path"; // Node.js Path module
import { MsEdgeTTS, OUTPUT_FORMAT } from "edge-tts-node"; // Microsoft Edge Text-to-Speech client
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url'; // To convert import.meta.url to a path

// --- Configuration ---
// Load environment variables from .env file
dotenv.config();

// IMPORTANT: Store your API key securely, e.g., in an environment variable.
// GEMINI_API_KEY is for the Generative AI SDK (transcription)
// Process.env.GOOGLE_API_KEY if using dotenv.
const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY";
if (!API_KEY || API_KEY === "YOUR_API_KEY") {
  console.error("Please set the GEMINI_API_KEY environment variable in your .env file or replace 'YOUR_API_KEY' in the script.");
  console.error("You can get one from: https://ai.google.dev/gemini-api/docs/api-key");
  process.exit(1);
}

// edge-tts-node does not require separate API key configuration like Google Cloud TTS.
// It uses Microsoft Edge's online services.

const genAI = new GoogleGenerativeAI(API_KEY);

// Directories
const STT_INPUT_DIR = path.join(process.cwd(), "data", "speech-to-text", "input"); 
const STT_OUTPUT_DIR = path.join(process.cwd(), "data", "speech-to-text", "output");
const TTS_INPUT_DIR = path.join(process.cwd(), "data", "text-to-speech", "input"); 
const TTS_AUDIO_OUTPUT_DIR_NAME = "output"; 
const TTS_OUTPUT_DIR = path.join(process.cwd(), "data", "text-to-speech", TTS_AUDIO_OUTPUT_DIR_NAME); 
const UPLOADS_DIR_NAME = "uploads";
const UPLOADS_DIR = path.join(process.cwd(), UPLOADS_DIR_NAME);

// --- Function to convert audio to text ---
// (transcribeAudioWithGemini function remains the same)

async function transcribeAudioWithGemini(audioPath) {
  try {
    if (!fs.existsSync(audioPath)) {
        console.error(`Audio file not found: ${audioPath}`);
        return null; // Return null if file doesn't exist
    }

    const audioBuffer = fs.readFileSync(audioPath);

    // Determine MIME type
    const supportedExtensions = {
      ".mp3": "audio/mp3",
      ".wav": "audio/wav",
      ".flac": "audio/flac",
      ".m4a": "audio/m4a",
      ".ogg": "audio/ogg"
    };
    let mimeType;
    const ext = path.extname(audioPath).toLowerCase();

    if (supportedExtensions[ext]) {
      mimeType = supportedExtensions[ext];
    } else {
      console.error(`Unsupported audio file format for ${path.basename(audioPath)}: ${ext}. Supported: ${Object.keys(supportedExtensions).join(', ')}.`);
      return null; // Return null for unsupported formats
    }

    // Using a known valid and efficient model.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contents = [
      {
        inlineData: {
          data: audioBuffer.toString("base64"),
          mimeType: mimeType,
        },
      },
      { text: "Generate a transcript of the speech in this audio." }, // Your prompt
      // You can add more specific instructions to your prompt, e.g.:
      // { text: "Transcribe this audio word for word, including speaker labels if possible, and timestamps." }
    ];

    console.log(`Sending audio file: ${path.basename(audioPath)} (${(audioBuffer.length / (1024 * 1024)).toFixed(2)} MB) to Gemini for transcription...`);
    // Pass the array of Part objects directly.
    // The SDK will correctly wrap this into the required request structure.
    const result = await model.generateContent(contents);
    const response = await result.response;
    const text = response.text();
    console.log(`Successfully transcribed: ${path.basename(audioPath)}`);
    return text;

  } catch (error) {
    console.error(`An error occurred while transcribing ${path.basename(audioPath)}: ${error.message}`);
    if (error.response && error.response.error) {
      console.error("API Error Details:", JSON.stringify(error.response.error, null, 2));
    } else if (error.candidates && error.candidates.length > 0 && error.candidates[0].finishReason !== 'STOP') {
      // Log details if the API blocked the request or it failed for other reasons
      console.error("API Error: Transcription may have been blocked or failed. Finish Reason:", error.candidates[0].finishReason);
      if(error.candidates[0].safetyRatings) {
        console.error("Safety Ratings:", JSON.stringify(error.candidates[0].safetyRatings, null, 2));
      }
    }
    return null; // Return null on error
  }
}

// --- Main processing function ---
async function processAudioFiles() {
  console.log(`Looking for audio files in: ${STT_INPUT_DIR}`);
  console.log(`Transcriptions will be saved to: ${STT_OUTPUT_DIR}`);

  // Ensure audio directory exists
  if (!fs.existsSync(STT_INPUT_DIR)) {
    console.error(`Speech-to-Text input directory not found: ${STT_INPUT_DIR}`);
    console.log("Please create this directory and place your audio files there.");
    return;
  }

  // Ensure transcriptions directory exists, create if not
  if (!fs.existsSync(STT_OUTPUT_DIR)) {
    try {
      fs.mkdirSync(STT_OUTPUT_DIR, { recursive: true });
      console.log(`Created Speech-to-Text output directory: ${STT_OUTPUT_DIR}`);
    } catch (err) {
      console.error(`Failed to create Speech-to-Text output directory: ${STT_OUTPUT_DIR}`, err);
      return;
    }
  }

  const files = fs.readdirSync(STT_INPUT_DIR);
  const supportedAudioExtensions = [".mp3", ".wav", ".flac", ".m4a", ".ogg"]; // Keep this in sync with transcribeAudioWithGemini
  
  const audioFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return supportedAudioExtensions.includes(ext);
  });
  if (audioFiles.length === 0) {
    console.log(`No supported audio files (${supportedAudioExtensions.join(', ')}) found in ${AUDIO_DIR}.`);
    return;
  }

  console.log(`Found ${audioFiles.length} audio file(s) to process: ${audioFiles.join(', ')}`);

  for (const audioFile of audioFiles) {
    const audioFilePath = path.join(STT_INPUT_DIR, audioFile);
    const fileExtension = path.extname(audioFile);
    const originalName = path.basename(audioFile, fileExtension); // Get name without extension

    const outputFileName = `${originalName}_transcription.txt`;
    const outputFilePath = path.join(STT_OUTPUT_DIR, outputFileName);

    console.log(`\nProcessing: ${audioFile}`);
    const transcription = await transcribeAudioWithGemini(audioFilePath);

    if (transcription) {
      try {
        fs.writeFileSync(outputFilePath, transcription);
        console.log(`Transcription saved to: ${outputFilePath}`);
      } catch (err) {
        console.error(`Failed to write transcription to file ${outputFilePath}:`, err);
      }
    } else {
      console.log(`Skipping saving transcription for ${audioFile} due to previous errors.`);
    }
  }
  console.log("\nAll processing finished.");
}

// --- Function to convert text to speech (MP3) ---
// Attempt to disable word boundaries to get a cleaner audio stream - moved to top level for server
MsEdgeTTS.wordBoundaryEnabled = false;

async function convertTextToMp3(textFilePath, outputMp3Path) {
  const tts = new MsEdgeTTS({});

  // Configure the WebSocket to receive ArrayBuffer for binary data.
  tts.setConfig({ arraybuffer: true });

  try {
    if (!fs.existsSync(textFilePath)) {
      console.error(`Text file not found: ${textFilePath}`);
      return false;
    }

    const text = fs.readFileSync(textFilePath, 'utf8');
    if (!text.trim()) {
      console.warn(`Text file is empty, skipping: ${path.basename(textFilePath)}`);
      return false;
    }
    console.log(`Requesting speech synthesis for: ${path.basename(textFilePath)}`);
    const selectedVoice = "en-US-AriaNeural"; 
    const selectedFormat = OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3; 
    console.log(` - Voice: ${selectedVoice}, Format: ${selectedFormat}`);

    // Set voice and output format
    await tts.setMetadata(selectedVoice, selectedFormat);
    console.log("Metadata set. Calling tts.toFile()...");

    // Synthesize text to a stream and pipe to file
    return new Promise((resolve, reject) => {
      const audioStream = tts.toStream(text); // Get the readable stream
      const fileWriteStream = fs.createWriteStream(outputMp3Path);

      audioStream.pipe(fileWriteStream);

      fileWriteStream.on('finish', () => {
        // Verify that data was actually written
        const stats = fs.statSync(outputMp3Path);
        if (stats.size > 0) {
          console.log(`✅ Audio content written to file: ${outputMp3Path} (Size: ${stats.size} bytes)`);
          resolve(true);
        } else {
          console.warn(`⚠️ No audio data written to ${outputMp3Path}. File was empty and has been deleted.`);
          try {
            fs.unlinkSync(outputMp3Path); // Clean up empty file
          } catch (unlinkError) {
            console.error(`Failed to delete empty file ${outputMp3Path}:`, unlinkError);
          }
          reject(new Error("No audio data received, created file was empty."));
        }
      });

      audioStream.on('error', (err) => {
        console.error(`Error from audio stream for ${path.basename(textFilePath)}:`, err);
        try {
          if (fs.existsSync(outputMp3Path)) {
            fs.unlinkSync(outputMp3Path); // Attempt to clean up
          }
        } catch (unlinkError) {
          // Log but don't overshadow the original error
        }
        reject(err);
      });

      fileWriteStream.on('error', (err) => {
        console.error(`Error writing audio to file ${outputMp3Path}:`, err);
        // No need to unlink here as 'finish' won't be called, or audioStream error would handle it
        reject(err);
      });
    });

  } catch (error) {
    console.error(`TTS Error during synthesis for ${path.basename(textFilePath)}:`, error);
    // console.error(`Failed to synthesize speech for ${path.basename(textFilePath)}: ${error.message || error}`);
    return false;
  }
}

// --- Main processing function for Text-to-Speech ---
async function processTextFilesToSpeech() {
  console.log(`\n--- Starting Text-to-Speech Processing ---`);
  console.log(`Looking for text files in: ${TTS_INPUT_DIR}`);
  console.log(`MP3 output will be saved to: ${TTS_OUTPUT_DIR}`);

  if (!fs.existsSync(TTS_INPUT_DIR)) {
    console.error(`Text-to-Speech input directory not found: ${TTS_INPUT_DIR}`);
    console.log("Please create this directory and place your .txt files there.");
    return;
  }

  if (!fs.existsSync(TTS_OUTPUT_DIR)) {
    try {
      fs.mkdirSync(TTS_OUTPUT_DIR, { recursive: true });
      console.log(`Created Text-to-Speech output directory: ${TTS_OUTPUT_DIR}`);
    } catch (err) {
      console.error(`Failed to create Text-to-Speech output directory: ${TTS_OUTPUT_DIR}`, err);
      return;
    }
  }

  const files = fs.readdirSync(TTS_INPUT_DIR);
  const txtFiles = files.filter(file => path.extname(file).toLowerCase() === ".txt");

  if (txtFiles.length === 0) {
    console.log(`No .txt files found in ${TTS_INPUT_DIR}.`);
    return;
  }

  console.log(`Found ${txtFiles.length} .txt file(s) to process: ${txtFiles.join(', ')}`);

  for (const txtFile of txtFiles) {
    const textFilePathLocal = path.join(TTS_INPUT_DIR, txtFile); // Renamed to avoid conflict
    const originalName = path.basename(txtFile, ".txt");
    const outputMp3Path = path.join(TTS_OUTPUT_DIR, `${originalName}.mp3`);
    await convertTextToMp3(textFilePathLocal, outputMp3Path);
  }
  console.log("\nAll text-to-speech processing finished.");
}

// --- Run the transcription ---
// To check if the script is run directly in ES modules:
const __filename = fileURLToPath(import.meta.url);
const scriptPath = path.resolve(process.argv[1]);

// --- Web Server Setup ---
const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// Ensure TTS output directory exists (for web serving)
if (!fs.existsSync(TTS_OUTPUT_DIR)) {
    fs.mkdirSync(TTS_OUTPUT_DIR, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.static('public')); // Serve HTML, CSS, client-side JS
app.use(`/${TTS_AUDIO_OUTPUT_DIR_NAME}`, express.static(TTS_OUTPUT_DIR)); // Serve generated MP3s

// STT Endpoint
app.post('/api/stt', upload.single('audioFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }
  const audioPath = req.file.path;
  try {
    const transcription = await transcribeAudioWithGemini(audioPath);
    if (transcription) {
      res.json({ transcription });
    } else {
      res.status(500).json({ error: 'Failed to transcribe audio.' });
    }
  } catch (error) {
    console.error("STT API Error:", error);
    res.status(500).json({ error: 'Error during transcription process.' });
  } finally {
    fs.unlink(audioPath, err => { // Clean up uploaded file
      if (err) console.error("Failed to delete temp audio file:", err);
    });
  }
});

// TTS Endpoint
app.post('/api/tts', upload.single('textFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No text file uploaded.' });
  }
  const textFilePath = req.file.path;
  const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
  const outputMp3FileName = `${originalName}-${Date.now()}.mp3`;
  const outputMp3Path = path.join(TTS_OUTPUT_DIR, outputMp3FileName);

  try {
    const success = await convertTextToMp3(textFilePath, outputMp3Path);
    if (success) {
      res.json({ audioUrl: `/${TTS_AUDIO_OUTPUT_DIR_NAME}/${outputMp3FileName}` });
    } else {
      res.status(500).json({ error: 'Failed to convert text to speech.' });
    }
  } catch (error) {
    console.error("TTS API Error:", error);
    res.status(500).json({ error: 'Error during TTS process.' });
  } finally {
    fs.unlink(textFilePath, err => { // Clean up uploaded file
      if (err) console.error("Failed to delete temp text file:", err);
    });
  }
});

if (__filename === scriptPath) {
  // This block runs when the script is executed directly
  const args = process.argv.slice(2); // Get command line arguments after 'node index.js'
  let taskToRun = null;

  for (const arg of args) {
    if (arg.startsWith('--task=')) {
      taskToRun = arg.split('=')[1];
      break;
    }
  }

  (async () => {
    if (taskToRun === 'stt') {
      console.log("Executing Speech-to-Text (STT) process...");
      await processAudioFiles().catch(err => {
        console.error("Unhandled error in STT processing:", err);
      });
    } else if (taskToRun === 'tts') {
      console.log("Executing Text-to-Speech (TTS) process...");
      await processTextFilesToSpeech().catch(err => {
        console.error("Unhandled error in TTS processing:", err);
      });
    } else if (taskToRun === null && args.length === 0) {
      // Default behavior: Start the web server if no task is specified
      app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`TTS audio will be available under /${TTS_AUDIO_OUTPUT_DIR_NAME}/<filename>.mp3`);
      });
    } else {
      console.log("No valid task specified (--task=stt or --task=tts) and not starting server.");
      console.log("To start the web server, run 'node index.js' or 'npm start'.");
    }
  })();
}