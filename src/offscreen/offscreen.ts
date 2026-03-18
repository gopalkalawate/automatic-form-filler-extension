/**
 * offscreen.ts
 * 
 * Handles navigator.mediaDevices to capture mic audio.
 * Saves recording as base64 or blob and sends it back to background script.
 */

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.target !== 'offscreen') return false;

    if (message.type === 'start-recording') {
        startRecording()
            .then(() => sendResponse({ success: true }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    } else if (message.type === 'stop-recording') {
        stopRecording()
            .then(data => sendResponse({ success: true, audioDataUrl: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

async function startRecording() {
    audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
        }
    };
    
    mediaRecorder.start();
}

async function stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
            return reject(new Error('MediaRecorder not initialized'));
        }

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Convert to data URL to send over Chrome Messaging
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                resolve(reader.result as string);
                
                // Stop all tracks to release mic
                mediaRecorder?.stream.getTracks().forEach(track => track.stop());
            };
            
            reader.onerror = () => reject(new Error('Failed to read audio blob'));
        };

        mediaRecorder.stop();
    });
}
