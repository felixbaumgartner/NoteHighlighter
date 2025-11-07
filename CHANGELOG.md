# Changelog

All notable changes to the Note Highlighter Chrome extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-07

### Added
- Initial release of Note Highlighter Chrome extension
- Text highlighting functionality on any webpage
- Multiple highlight colors (Yellow, Green, Blue, Pink, Orange)
- Persistent storage of highlights using Chrome Storage API
- Google Docs integration for copying highlights
- Context menu options for quick highlighting and copying
- Extension popup with highlight management interface
- Export highlights to JSON format
- Clear all highlights functionality
- Keyboard shortcut (Ctrl/Cmd + Click) to copy highlighted text
- OAuth 2.0 authentication with Google
- Icon generator tools (HTML and Python)
- Comprehensive documentation (README, SETUP guide)

### Features
- **Highlight Colors**: Choose from 5 beautiful preset colors
- **Persistent Highlights**: Highlights are saved and restored on page revisits
- **Google Docs Integration**:
  - Create new Google Docs with highlighted text
  - Copy individual highlights
  - Copy all highlights from a page at once
- **User Interface**:
  - Clean, modern popup interface
  - Real-time highlight count
  - Color picker for easy customization
  - Highlight list with preview
- **Export/Import**: Export highlights as JSON for backup
- **Privacy-focused**: All data stored locally, no external tracking

### Technical Details
- Built with Manifest V3
- Uses Chrome Storage API for data persistence
- Implements Google Docs API v1 for document creation
- Service worker architecture for background tasks
- Content script for DOM manipulation
- Vanilla JavaScript (no external dependencies)

## [Unreleased]

### Planned Features
- Highlight annotations and notes
- Search within highlights
- Browser sync across devices
- Support for highlighting images and code blocks
- Share highlights with other users
- Import/export to Markdown format
- Integration with Notion, Evernote, and other note-taking apps
- Customizable keyboard shortcuts
- Dark mode support
- Highlight categories/tags

---

## Version History

- **1.0.0** (2025-11-07): Initial release
