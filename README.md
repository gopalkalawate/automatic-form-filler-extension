# PatientVoiceFiller Extension (Frontend)

This is a Vite + React + TypeScript Chrome Extension that acts as the user interface and browser interactor for PatientVoiceFiller.

## Setup Instructions

### 1. Configure the Backend (API Keys)
Before using the extension, the Node.js backend proxy must be running and configured with API keys.
1. Navigate to the `backend/` directory: `cd ../backend`
2. Run `npm install`
3. Create a `.env` file in the `backend/` directory and add your keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the backend proxy by running `node server.js`

### 2. Build the Extension
1. Ensure you are in the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the production extension using Vite:
   ```bash
   npm run build
   ```
   This will create a `dist/` directory containing the bundled extension.

### 3. Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** in the top left.
4. Select the `dist/` folder that was just generated inside your `frontend/` directory.
5. Give permission , go to chrome://extensions/ , then click on details , click on site settings , allow the microphone.

### 4. Usage
- Pin the extension to your browser toolbar.
- Open any web page containing an HTML form (e.g., a dummy medical form).
- Click the PatientVoiceFiller extension icon.
- Click "Start Recording" and speak your symptoms in Marathi or Hindi.
- Click "Stop & Process". 
- Watch the fields automatically populate!
