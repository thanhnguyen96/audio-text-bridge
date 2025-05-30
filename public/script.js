document.addEventListener('DOMContentLoaded', () => {
    // STT Elements
    const audioFileInput = document.getElementById('audioFile');
    const sttButton = document.getElementById('sttButton');
    const sttResultDiv = document.getElementById('sttResult');
    const sttErrorDiv = document.getElementById('sttError');
    const sttLoader = document.getElementById('sttLoader');

    // TTS Elements
    const textFileInput = document.getElementById('textFile');
    const ttsButton = document.getElementById('ttsButton');
    const ttsResultDiv = document.getElementById('ttsResult');
    const ttsErrorDiv = document.getElementById('ttsError');
    const ttsLoader = document.getElementById('ttsLoader');

    // Helper to show/hide elements
    const show = (el) => el.style.display = 'block';
    const hide = (el) => el.style.display = 'none';
    const showInline = (el) => el.style.display = 'inline-block';


    // STT Button Click
    sttButton.addEventListener('click', async () => {
        const file = audioFileInput.files[0];
        if (!file) {
            sttErrorDiv.textContent = 'Please select an audio file.';
            show(sttErrorDiv);
            hide(sttResultDiv);
            return;
        }

        hide(sttErrorDiv);
        hide(sttResultDiv);
        showInline(sttLoader);
        sttButton.disabled = true;

        const formData = new FormData();
        formData.append('audioFile', file);

        try {
            const response = await fetch('/api/stt', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                sttResultDiv.textContent = result.transcription;
                show(sttResultDiv);
            } else {
                sttErrorDiv.textContent = result.error || 'An unknown error occurred.';
                show(sttErrorDiv);
            }
        } catch (error) {
            console.error('STT Error:', error);
            sttErrorDiv.textContent = 'Failed to connect to the server or an unexpected error occurred.';
            show(sttErrorDiv);
        } finally {
            hide(sttLoader);
            sttButton.disabled = false;
            audioFileInput.value = ''; // Clear file input
        }
    });

    // TTS Button Click
    ttsButton.addEventListener('click', async () => {
        const file = textFileInput.files[0];
        if (!file) {
            ttsErrorDiv.textContent = 'Please select a text file.';
            show(ttsErrorDiv);
            hide(ttsResultDiv);
            return;
        }

        hide(ttsErrorDiv);
        hide(ttsResultDiv);
        showInline(ttsLoader);
        ttsButton.disabled = true;

        const formData = new FormData();
        formData.append('textFile', file);

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                ttsResultDiv.innerHTML = `Audio generated: <a href="${result.audioUrl}" target="_blank" download>Download MP3</a>
                                         <br><audio controls src="${result.audioUrl}"></audio>`;
                show(ttsResultDiv);
            } else {
                ttsErrorDiv.textContent = result.error || 'An unknown error occurred.';
                show(ttsErrorDiv);
            }
        } catch (error) {
            console.error('TTS Error:', error);
            ttsErrorDiv.textContent = 'Failed to connect to the server or an unexpected error occurred.';
            show(ttsErrorDiv);
        } finally {
            hide(ttsLoader);
            ttsButton.disabled = false;
            textFileInput.value = ''; // Clear file input
        }
    });
});
