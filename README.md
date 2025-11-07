# Note Highlighter - Chrome Extension

A powerful Chrome extension that allows you to highlight text on any webpage and seamlessly copy your highlights to Google Docs.

## Features

- **Text Highlighting**: Select any text on a webpage and highlight it with customizable colors
- **Persistent Storage**: Your highlights are saved and restored when you revisit pages
- **Multiple Colors**: Choose from 5 beautiful highlight colors (Yellow, Green, Blue, Pink, Orange)
- **Google Docs Integration**: Copy individual highlights or all highlights to Google Docs
- **Target Document**: Set a specific Google Doc to append all highlights to, or create new docs each time
- **Easy Management**: View, export, and clear your highlights through an intuitive popup interface
- **Context Menu**: Right-click to quickly highlight or copy text
- **Keyboard Shortcuts**: Ctrl/Cmd + Click on highlighted text to copy to Google Docs

## Installation

### From Source (Developer Mode)

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/felixbaumgartner/NoteHighlighter.git
   cd NoteHighlighter
   ```

2. **Generate Icons**
   - Open `generate-icons.html` in your browser
   - Download all three icon sizes (16x16, 48x48, 128x128)
   - Save them in the `icons/` folder as `icon16.png`, `icon48.png`, and `icon128.png`

3. **Set up Google OAuth (for Google Docs integration)**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the **Google Docs API**
   - Go to **Credentials** > **Create Credentials** > **OAuth client ID**
   - Choose **Chrome extension** as the application type
   - Add your extension ID (you'll get this after loading the extension)
   - Copy the Client ID and update it in `manifest.json`:
     ```json
     "oauth2": {
       "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
       ...
     }
     ```

4. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `NoteHighlighter` folder
   - Note the Extension ID and update your Google OAuth settings if needed

## Usage

### Highlighting Text

**Method 1: Selection Button**
1. Select any text on a webpage
2. Click the "Highlight" button that appears
3. The text will be highlighted with your selected color

**Method 2: Context Menu**
1. Select text and right-click
2. Choose "Highlight selected text"

### Copying to Google Docs

**Setting a Target Document (Optional)**

You can configure the extension to always append highlights to a specific Google Doc:

1. Open the extension popup
2. In the "Target Document" section, paste a Google Doc URL or ID
3. Click "Set Document"
4. All future highlights will be appended to this document with timestamps

To go back to creating new documents each time, click "Use New Docs Each Time"

**Method 1: Individual Highlight**
1. Hold Ctrl (Windows/Linux) or Cmd (Mac)
2. Click on any highlighted text
3. Text will be appended to your target document (if set) or a new doc will be created

**Method 2: From Selection**
1. Select text and right-click
2. Choose "Copy to Google Docs"

**Method 3: Copy All Highlights**
1. Click the extension icon in the toolbar
2. Click "Copy All to Docs"
3. All highlights from the current page will be copied to your target document or a new doc

### Managing Highlights

**Extension Popup**
- Click the extension icon to open the control panel
- View all highlights on the current page
- Change highlight color
- Export highlights as JSON
- Clear all highlights from the page

**Change Highlight Color**
1. Open the extension popup
2. Click on your preferred color
3. New highlights will use this color

**Export Highlights**
1. Open the extension popup
2. Click "Export Highlights"
3. A JSON file with all your highlights will be downloaded

**Clear Highlights**
1. Open the extension popup
2. Click "Clear All"
3. Confirm the action

## File Structure

```
NoteHighlighter/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for Google Docs API
├── content.js             # Content script for highlighting
├── content.css            # Styles for highlights and UI
├── popup.html             # Extension popup interface
├── popup.css              # Popup styles
├── popup.js               # Popup functionality
├── generate-icons.html    # Icon generator tool
├── icons/
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   ├── icon128.png       # 128x128 icon
│   ├── icon.svg          # Vector icon source
│   └── README.md         # Icon generation instructions
└── README.md             # This file
```

## Permissions

The extension requires the following permissions:

- **storage**: To save your highlights locally
- **activeTab**: To highlight text on the current page
- **contextMenus**: To add right-click menu options
- **identity**: For Google authentication
- **https://docs.google.com/\***: To create and edit Google Docs

## Privacy

- All highlights are stored locally in your browser
- No data is sent to external servers except Google Docs (when you explicitly choose to copy)
- Google authentication is only used for creating/editing Google Docs
- The extension does not track or collect any personal information

## Troubleshooting

### Highlights not saving
- Check if you've granted storage permissions
- Try refreshing the page after highlighting

### Google Docs integration not working
1. Make sure you've set up OAuth credentials in manifest.json
2. Click "Connect Google" in the extension popup
3. Grant the necessary permissions
4. Check the browser console for error messages

### Extension not loading
- Ensure all files are in the correct locations
- Generate the required icon files
- Check for errors in `chrome://extensions/`

## Development

### Technologies Used
- **Manifest V3**: Latest Chrome extension format
- **Vanilla JavaScript**: No external dependencies
- **Google Docs API**: For document creation
- **Chrome Storage API**: For persistent data
- **Chrome Identity API**: For OAuth authentication

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

### Future Enhancements
- [ ] Support for highlighting images and code blocks
- [ ] Share highlights with other users
- [ ] Browser sync across devices
- [ ] Support for other cloud storage services (Notion, Evernote, etc.)
- [ ] Highlight annotations and notes
- [ ] Search within highlights
- [ ] Import/export to markdown format

## License

MIT License - feel free to use this extension for personal or commercial projects.

## Support

If you encounter any issues or have suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

## Credits

Created by Felix Baumgartner
- GitHub: [@felixbaumgartner](https://github.com/felixbaumgartner)

---

**Note**: This extension requires active internet connection for Google Docs integration. Highlighting functionality works offline.
