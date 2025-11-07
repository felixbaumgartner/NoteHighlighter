# Troubleshooting Guide - Note Highlighter Extension

## 🚨 If highlighting is not working, follow these steps:

### Step 1: Verify Extension is Loaded

1. **Open Chrome Extensions Page:**
   - Go to `chrome://extensions/`
   - Or click the puzzle icon (🧩) in Chrome toolbar → Manage Extensions

2. **Check Note Highlighter:**
   - ✅ Should show "Note Highlighter" with version 1.1.1
   - ✅ Toggle should be ON (blue)
   - ✅ No errors should be shown

3. **If NOT loaded:**
   - Click **"Load unpacked"**
   - Select the `NoteHighlighter` folder
   - Check for errors

### Step 2: Reload the Extension

**IMPORTANT:** After any code changes, you MUST reload:

1. Go to `chrome://extensions/`
2. Find "Note Highlighter"
3. Click the **circular arrow icon** (reload)
4. Close and reopen any open tabs

### Step 3: Check Browser Console

1. **Open any webpage**
2. **Press F12** (or right-click → Inspect)
3. **Click "Console" tab**
4. **Select some text** on the page
5. **Look for messages:**
   - ✅ Should see: `Note Highlighter: Initializing content script`
   - ✅ When you select text: `Note Highlighter: Text selection detected`
   - ✅ When button appears: `Note Highlighter: showHighlightButton called`

### Step 4: Use the Debug Page

1. **Open the debug tool:**
   ```
   file:///path/to/NoteHighlighter/debug.html
   ```
   Or just open `debug.html` in Chrome

2. **Run all checks:**
   - Click "Check Extension" button
   - Click "Check Content Script" button
   - Select text and click "Test Selection API"

3. **Look for GREEN checkmarks:**
   - ✅ Extension loaded successfully
   - ✅ Content script loaded
   - ✅ Selection API working

## Common Issues & Solutions

### Issue 1: "Content script NOT loaded"

**Symptoms:**
- No highlight button appears when selecting text
- Console shows: Extension loaded but highlightManager not found

**Solution:**
1. **Check manifest.json:**
   - Ensure `content_scripts` section exists
   - Verify `matches: ["<all_urls>"]`

2. **Reload extension:**
   - Go to `chrome://extensions/`
   - Click reload icon on Note Highlighter
   - **CLOSE AND REOPEN the test page**

3. **Check permissions:**
   - Extension should have `activeTab` permission
   - May need to grant additional permissions

### Issue 2: Button appears but nothing happens when clicked

**Symptoms:**
- Highlight button shows up
- Clicking does nothing
- No console errors

**Solution:**
1. **Check console for click events:**
   - Should see: `Note Highlighter: Highlight button clicked`
   - Should see: `Note Highlighter: highlightRange called`

2. **If not seeing these messages:**
   - Event listeners may not be attached
   - Try reloading extension

3. **Check for JavaScript errors:**
   - Look for red error messages in console
   - Fix any errors in content.js

### Issue 3: Highlight doesn't appear visually

**Symptoms:**
- Console shows highlight was successful
- No visual highlight on page
- Storage shows highlight was saved

**Solution:**
1. **Check CSS is loaded:**
   - Open DevTools → Elements tab
   - Look for `<span class="note-highlight">` in the HTML
   - Check if element has `background-color` style

2. **If span exists but no color:**
   - CSS file may not be loaded
   - Check manifest.json has `css: ["content.css"]`
   - Reload extension

3. **Check z-index conflicts:**
   - Some sites may have high z-index elements covering highlights
   - Try highlighting simple text first

### Issue 4: Copy to Google Docs not working

**Symptoms:**
- Clicking "Copy to Docs" does nothing
- Or shows error message

**Solution:**
1. **Check Google OAuth setup:**
   - Open `manifest.json`
   - Verify `client_id` is NOT "YOUR_CLIENT_ID.apps.googleusercontent.com"
   - Must be actual OAuth client ID from Google Cloud Console

2. **Check if authenticated:**
   - Open extension popup
   - Should show "Connected to Google" in green
   - If not, click "Connect Google"

3. **Check background script console:**
   - Go to `chrome://extensions/`
   - Find Note Highlighter
   - Click "service worker" link (or "Inspect views: service worker")
   - Look for errors

4. **Check console logs:**
   - Should see: `Background: Received message: copyToGoogleDocs`
   - Should see: `Background: Copy result: {success: true}`

### Issue 5: Target Document not working

**Symptoms:**
- Set target document but highlights not appearing in Google Doc
- Getting authentication errors

**Solution:**
1. **Verify document ID:**
   - Open extension popup
   - Check "Target Document" section
   - Should show green box with document ID
   - Make sure it's not "No document set"

2. **Check document permissions:**
   - Open your Google Doc
   - Make sure you have edit access
   - Try with a new blank doc first

3. **Test authentication:**
   - Open extension popup
   - Click "Connect Google"
   - Grant all requested permissions
   - Check for "Connected to Google" status

## Debug Checklist

Use this checklist to systematically debug:

```
□ Extension loaded in chrome://extensions/
□ Extension toggle is ON (blue)
□ Reloaded extension after code changes
□ Closed and reopened test pages
□ Can see "Initializing content script" in console
□ Selecting text triggers "Text selection detected" log
□ Highlight button appears after selecting text
□ Clicking highlight button shows "Highlight button clicked"
□ Can see span.note-highlight elements in DOM
□ Highlights have background-color style applied
□ OAuth client_id is configured in manifest.json
□ "Connect Google" shows "Connected to Google"
□ Target document ID is set (if using target doc feature)
□ Background script shows no errors
```

## Still Not Working?

### Get More Debug Info:

1. **Export debug logs:**
   - Open debug.html
   - Run all tests
   - Copy console output
   - Check for specific error messages

2. **Check Extension Service Worker:**
   ```
   chrome://extensions/
   → Note Highlighter
   → "service worker" link
   → Check console for errors
   ```

3. **Verify all files exist:**
   ```
   NoteHighlighter/
   ├── manifest.json ✓
   ├── content.js ✓
   ├── content.css ✓
   ├── background.js ✓
   ├── popup.html ✓
   ├── popup.js ✓
   ├── popup.css ✓
   └── icons/ ✓
       ├── icon16.png
       ├── icon48.png
       └── icon128.png
   ```

4. **Test on simple page first:**
   - Open debug.html or test.html
   - These have minimal styling/scripts
   - Should work if extension is loaded correctly

### Common Console Errors:

**Error:** `Uncaught ReferenceError: chrome is not defined`
- **Fix:** Content script not injected. Reload extension and page.

**Error:** `Cannot read properties of undefined (reading 'rangeCount')`
- **Fix:** Selection object is invalid. Check timing of selection capture.

**Error:** `Failed to execute 'surroundContents' on 'Range'`
- **Fix:** Selected text spans multiple elements. Select simpler text.

**Error:** `chrome.runtime.lastError: Could not establish connection`
- **Fix:** Background script crashed. Reload extension.

## Manual Testing Steps:

1. **Test on debug.html:**
   ```bash
   1. Open debug.html in Chrome
   2. Click "Check Extension" - should be ✅
   3. Click "Check Content Script" - should be ✅
   4. Select text from test paragraphs
   5. Highlight button should appear
   6. Click highlight button
   7. Text should turn yellow
   ```

2. **Test on simple webpage:**
   ```bash
   1. Go to example.com
   2. Select some text
   3. Click highlight button
   4. Verify highlight appears
   5. Ctrl/Cmd + Click highlighted text
   6. Check if copied to Google Docs
   ```

3. **Test target document:**
   ```bash
   1. Create new Google Doc
   2. Copy its URL
   3. Open extension popup
   4. Paste URL in "Target Document" field
   5. Click "Set Document"
   6. Should show green "Appending to: [ID]"
   7. Highlight text and copy
   8. Check Google Doc for appended text
   ```

## Getting Help:

If none of these steps work:

1. **Capture full debug output:**
   - Open debug.html
   - Run all tests
   - Copy all console logs
   - Take screenshot of any errors

2. **Document the issue:**
   - What steps did you try?
   - What page were you testing on?
   - What error messages appeared?
   - What does the console show?

3. **Check for conflicts:**
   - Disable other extensions temporarily
   - Try in incognito mode
   - Test on different websites

---

**Last Updated:** v1.1.1
**For more help:** Check README.md and SETUP.md
