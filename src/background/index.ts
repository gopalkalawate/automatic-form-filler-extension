/**
 * background/index.ts
 * 
 * Central orchestrator. Handles offscreen document lifecycle, communicates with
 * popup UI, asks scanner for fields, sends data to Node.js backend, and lastly
 * sends mapped values to injector script.
 */

// Basic config mapping, matching en.json
const BACKEND_URL = 'http://localhost:5050/api/parse';

// Handle messages from Popup
chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log("Before Starting recording...");
    if (request.action === 'START_RECORDING') {
        handleStartRecording().then(() => sendResponse({ success: true })).catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
    console.log("After Starting recording...");
    if (request.action === 'STOP_AND_PROCESS') {
        handleStopAndProcess().then(result => sendResponse({ success: true, result })).catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

});

async function handleStartRecording() {
    console.log('before calling setupOffscreenDocument');
    await setupOffscreenDocument('src/offscreen/index.html');
    // await setupOffscreenDocument('offscreen/index.html');
    // Start recording in offscreen
    console.log('after calling setupOffscreenDocument');
    const response = await chrome.runtime.sendMessage({
        type: 'start-recording',
        target: 'offscreen'
    });

    console.log('after doing API Call to start recording , response is:', response);

    
    if (!response.success) {
        console.error('Error starting recording: This is the error actually:', response.error);
        throw new Error(response.error || 'Failed to start recording');
    }
}

async function handleStopAndProcess() {
    console.log('[PatientVoiceFiller Background] Stopping recording...');
    // 1. Stop recording and get base64 audio
    const audioResponse = await chrome.runtime.sendMessage({
        type: 'stop-recording',
        target: 'offscreen'
    });
    
    if (!audioResponse.success) {
        throw new Error(audioResponse.error || 'Failed to stop recording');
    }
    
    const audioDataUrl = audioResponse.audioDataUrl;
    console.log('[PatientVoiceFiller Background] Audio captured.');

    // 2. Query Active Tab for Form Fields (Scanner)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active window found.');

    console.log('[PatientVoiceFiller Background] Scanning tab for fields...');
    const scanResponse = await chrome.tabs.sendMessage(tab.id, { action: 'SCAN_FIELDS' });
    const fieldsMap = scanResponse?.fields;
    console.log('[PatientVoiceFiller Background] Fields found:', fieldsMap);
    if (!fieldsMap || Object.keys(fieldsMap).length === 0) {
        throw new Error('No compatible form fields found on the active page.');
    }

    // 3. Send Audio + Fields Map to Node Framework
    console.log('[PatientVoiceFiller Background] Uploading to backend...');
    const formData = new FormData();
    
    // Convert base64 data url back to Blob
    const response = await fetch(audioDataUrl);
    const audioBlob = await response.blob();
    
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('fieldsMap', JSON.stringify(fieldsMap));

    const backendRes = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData
    });

    if (!backendRes.ok) {
        const errorData = await backendRes.text();
        throw new Error(`Backend Error: ${errorData}`);
    }

    const { mappedValues, text } = await backendRes.json();
    console.log(`[PatientVoiceFiller Background] Mapped Values from Server:`, mappedValues);

    // 4. Send Mapped Values to Injector Script
    console.log('[PatientVoiceFiller Background] Injecting values into page...');
    await chrome.tabs.sendMessage(tab.id, {
        action: 'INJECT_FIELDS',
        mappedValues
    });

    return { text, mappedValues };
}


// --- Utility for managing offscreen document ---
let creating: Promise<void> | null;
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one 
  // of them is the offscreen document with the given path
  // @ts-ignore
  const offscreenUrl = chrome.runtime.getURL(path);
  // @ts-ignore
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['USER_MEDIA'],
      justification: 'Recording audio from the microphone'
    });
    await creating;
    creating = null;
  }
}
