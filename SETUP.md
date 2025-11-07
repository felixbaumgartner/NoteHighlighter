# Setup Guide for Note Highlighter

This guide will walk you through setting up the Note Highlighter Chrome extension with Google Docs integration.

## Quick Start (Without Google Docs)

If you just want to test the highlighting features without Google Docs integration:

1. Generate the icons (see below)
2. Load the extension in Chrome developer mode
3. Start highlighting!

## Full Setup (With Google Docs Integration)

### Step 1: Generate Icons

**Option A: Using the HTML Generator**
1. Open `generate-icons.html` in your web browser
2. Click each download button
3. Save the files to the `icons/` folder

**Option B: Using Python Script**
```bash
# Install Pillow if you haven't already
pip install Pillow

# Run the icon generator
python generate_icons.py
```

### Step 2: Set Up Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name it "Note Highlighter" or similar
   - Click "Create"

3. **Enable Google Docs API**
   - In the left sidebar, go to "APIs & Services" → "Library"
   - Search for "Google Docs API"
   - Click on it and press "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen:
     - Choose "External" user type
     - Fill in required fields (app name, user support email, developer email)
     - Add scopes: `https://www.googleapis.com/auth/documents`
     - Add your email as a test user
     - Save and continue

5. **Configure OAuth Client**
   - Application type: Choose "Web application" for now
   - Name: "Note Highlighter Extension"
   - Click "Create"
   - **Copy the Client ID** (you'll need this)

### Step 3: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Select the `NoteHighlighter` folder
   - The extension should now appear in your extensions list

4. **Copy the Extension ID**
   - Look for a long string like: `abcdefghijklmnopqrstuvwxyz123456`
   - Copy this ID

### Step 4: Update OAuth Settings

1. **Go Back to Google Cloud Console**
   - Navigate to "Credentials"
   - Click on your OAuth client

2. **Add Chrome Extension**
   - Actually, delete the web application client
   - Click "Create Credentials" → "OAuth client ID" again
   - Application type: Select "Chrome extension" (or "Chrome app")
   - Enter your extension ID from Step 3
   - Click "Create"
   - **Copy the new Client ID**

### Step 5: Update manifest.json

1. Open `manifest.json` in a text editor
2. Find the `oauth2` section
3. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:
   ```json
   "oauth2": {
     "client_id": "your-actual-client-id.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/documents"
     ]
   }
   ```
4. Save the file

### Step 6: Reload Extension

1. Go back to `chrome://extensions/`
2. Click the refresh icon on the Note Highlighter extension
3. The extension is now fully configured!

### Step 7: Test the Extension

1. **Test Highlighting**
   - Visit any webpage
   - Select some text
   - Click "Highlight" when the button appears

2. **Test Google Docs Integration**
   - Click the extension icon
   - Click "Connect Google"
   - Grant permissions when prompted
   - Try copying a highlight to Google Docs

## Troubleshooting

### Icons Not Showing
- Make sure you've generated all three icon files (16, 48, 128)
- Check that they're in the `icons/` folder
- Reload the extension

### OAuth Errors
- Verify your Client ID is correct in manifest.json
- Make sure you added the correct extension ID in Google Cloud Console
- Check that Google Docs API is enabled
- Ensure you're added as a test user in the OAuth consent screen

### Extension Not Loading
- Check the Chrome console for errors (`chrome://extensions/` → Details → Errors)
- Verify all required files are present
- Make sure manifest.json is valid JSON

### Google Docs Not Creating
- Check that you're authenticated (green checkmark in popup)
- Look for errors in the extension's service worker console
- Verify your OAuth token hasn't expired (disconnect and reconnect)

## Alternative: Testing Without OAuth

If you want to test the extension without setting up Google OAuth:

1. Comment out the Google Docs functionality in the code
2. Or simply skip the OAuth setup
3. The highlighting features will still work perfectly
4. You can copy text to clipboard instead of Google Docs

## Security Notes

- Keep your Client ID secure (though it's safe to commit to private repos)
- Never share your OAuth Client Secret (not used in this extension)
- The extension only requests minimal permissions needed
- Review the OAuth consent screen before granting permissions

## Next Steps

- Customize highlight colors in `content.css`
- Modify the popup UI in `popup.html`
- Add new features in `content.js`
- Submit to Chrome Web Store (requires additional setup)

## Publishing to Chrome Web Store

If you want to publish this extension:

1. Create a developer account ($5 one-time fee)
2. Prepare store listing materials (screenshots, description)
3. Set up a production OAuth client
4. Submit for review
5. Wait for approval (usually 1-3 days)

For detailed instructions, see: https://developer.chrome.com/docs/webstore/publish/

---

Need help? Check the main README.md or open an issue on GitHub.
