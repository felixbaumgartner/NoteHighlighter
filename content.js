// Content script for Note Highlighter extension

class HighlightManager {
  constructor() {
    this.highlights = [];
    this.currentColor = '#ffeb3b'; // Default yellow
    this.availableColors = [
      { name: 'yellow', value: '#ffeb3b' },
      { name: 'green', value: '#8bc34a' },
      { name: 'blue', value: '#64b5f6' },
      { name: 'pink', value: '#f48fb1' },
      { name: 'orange', value: '#ffb74d' }
    ];
    this.init();
  }

  init() {
    console.log('Note Highlighter: Initializing content script');

    // Load saved highlights from storage
    this.loadHighlights();

    // Listen for text selection
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));

    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true; // Keep channel open for async response
    });

    // Create context menu for highlights
    this.createHighlightMenu();

    console.log('Note Highlighter: Content script initialized successfully');
  }

  async loadHighlights() {
    const url = window.location.href;
    const result = await chrome.storage.local.get(['highlights']);
    const allHighlights = result.highlights || {};

    if (allHighlights[url]) {
      this.highlights = allHighlights[url];
      this.applyStoredHighlights();
    }
  }

  applyStoredHighlights() {
    this.highlights.forEach(highlight => {
      this.applyHighlight(highlight);
    });
  }

  handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log('Note Highlighter: Text selection detected', {
      selectedText: selectedText.substring(0, 50),
      length: selectedText.length,
      rangeCount: selection.rangeCount,
      mousePosition: { x: e.pageX, y: e.pageY }
    });

    if (selectedText.length === 0) {
      console.log('Note Highlighter: No text selected, skipping');
      return;
    }

    // Show highlight button near selection
    console.log('Note Highlighter: Showing highlight button');
    this.showHighlightButton(e.pageX, e.pageY, selection);
  }

  showHighlightButton(x, y, selection) {
    console.log('Note Highlighter: showHighlightButton called');

    // Remove existing button if any
    const existingBtn = document.getElementById('highlight-btn');
    if (existingBtn) {
      console.log('Note Highlighter: Removing existing button');
      existingBtn.remove();
    }

    // Preserve the selection range and text BEFORE any user interaction
    if (!selection.rangeCount) {
      console.error('Note Highlighter: No range count in selection');
      return;
    }

    const range = selection.getRangeAt(0).cloneRange();
    const selectedText = selection.toString().trim();

    console.log('Note Highlighter: Creating button for text:', selectedText.substring(0, 50));

    if (!selectedText) {
      console.error('Note Highlighter: Selected text is empty');
      return;
    }

    const button = document.createElement('div');
    button.id = 'highlight-btn';
    button.className = 'note-highlighter-btn';
    button.innerHTML = `
      <button id="do-highlight" title="Highlight">✨ Highlight</button>
      <button id="copy-to-docs" title="Copy to Google Docs">📄 Copy to Docs</button>
    `;
    button.style.position = 'absolute';
    button.style.left = `${x}px`;
    button.style.top = `${y + 10}px`;
    button.style.zIndex = '999999';

    console.log('Note Highlighter: Appending button to body at position', { x, y: y + 10 });
    document.body.appendChild(button);

    console.log('Note Highlighter: Button appended, adding event listeners');

    // Add click handlers with preserved range and text
    document.getElementById('do-highlight').addEventListener('click', (e) => {
      console.log('Note Highlighter: Highlight button clicked');
      e.stopPropagation();
      this.highlightRange(range, selectedText);
      button.remove();
    });

    document.getElementById('copy-to-docs').addEventListener('click', (e) => {
      console.log('Note Highlighter: Copy to Docs button clicked');
      e.stopPropagation();
      this.copyToGoogleDocs(selectedText);
      button.remove();
    });

    // Remove button when clicking elsewhere
    setTimeout(() => {
      const removeBtn = (e) => {
        if (!button.contains(e.target)) {
          console.log('Note Highlighter: Removing button (clicked elsewhere)');
          button.remove();
          document.removeEventListener('click', removeBtn);
        }
      };
      document.addEventListener('click', removeBtn);
    }, 100);
  }

  highlightRange(range, selectedText) {
    console.log('Note Highlighter: highlightRange called', {
      hasRange: !!range,
      textLength: selectedText ? selectedText.length : 0
    });

    if (!range || !selectedText) {
      console.error('Note Highlighter: Missing range or text');
      return;
    }

    // Create highlight data
    const highlightData = {
      text: selectedText,
      color: this.currentColor,
      timestamp: Date.now(),
      id: this.generateId()
    };

    console.log('Note Highlighter: Created highlight data', highlightData);

    // Wrap selection in highlight span
    const span = document.createElement('span');
    span.className = 'note-highlight';
    span.setAttribute('data-highlight-id', highlightData.id);
    span.style.backgroundColor = this.currentColor;

    console.log('Note Highlighter: Created span, attempting to surround contents');

    try {
      range.surroundContents(span);
      console.log('Note Highlighter: Successfully surrounded contents');

      // Add click handler to copy this highlight
      span.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          console.log('Note Highlighter: Ctrl/Cmd + Click on highlight');
          e.preventDefault();
          this.copyToGoogleDocs(highlightData.text);
        }
      });

      // Save highlight
      this.saveHighlight(highlightData);
      console.log('Note Highlighter: Highlight saved');

      // Clear selection
      window.getSelection().removeAllRanges();
    } catch (e) {
      console.error('Note Highlighter: Error applying highlight:', e);
      this.showNotification('Could not highlight this selection. Try a simpler text selection.');
    }
  }

  highlightSelection(selection) {
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText) return;

    this.highlightRange(range, selectedText);
  }

  applyHighlight(highlightData) {
    // Find and highlight text in the document
    // This is a simplified version - you may want to use a more robust text highlighting library
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes(highlightData.text)) {
        nodes.push(node);
      }
    }

    // Apply highlight to matching text nodes
    nodes.forEach(textNode => {
      const text = textNode.textContent;
      const index = text.indexOf(highlightData.text);

      if (index !== -1 && !textNode.parentElement.classList.contains('note-highlight')) {
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + highlightData.text.length);

        const span = document.createElement('span');
        span.className = 'note-highlight';
        span.setAttribute('data-highlight-id', highlightData.id);
        span.style.backgroundColor = highlightData.color;

        try {
          range.surroundContents(span);

          span.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
              this.copyToGoogleDocs(highlightData.text);
            }
          });
        } catch (e) {
          // Ignore errors for complex DOM structures
        }
      }
    });
  }

  async saveHighlight(highlightData) {
    const url = window.location.href;
    const result = await chrome.storage.local.get(['highlights']);
    const allHighlights = result.highlights || {};

    if (!allHighlights[url]) {
      allHighlights[url] = [];
    }

    allHighlights[url].push(highlightData);
    this.highlights = allHighlights[url];

    await chrome.storage.local.set({ highlights: allHighlights });
    this.showNotification('Text highlighted!');
  }

  async copyToGoogleDocs(text) {
    if (!text || text.trim().length === 0) {
      this.showNotification('No text to copy');
      return;
    }

    console.log('Copying to Google Docs:', text);

    // Check if chrome.runtime is available
    if (!chrome || !chrome.runtime) {
      console.error('Chrome runtime not available');
      this.showNotification('Extension error: Chrome runtime not available');
      return;
    }

    // Send message to background script to handle Google Docs API
    try {
      chrome.runtime.sendMessage({
        action: 'copyToGoogleDocs',
        text: text,
        title: `Highlight from ${document.title}`
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          this.showNotification(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (response && response.success) {
          this.showNotification('Copied to Google Docs!');
        } else {
          const errorMsg = response && response.error ? response.error : 'Unknown error';
          console.error('Copy to Docs failed:', errorMsg);
          this.showNotification(`Failed to copy: ${errorMsg}`);
        }
      });
    } catch (error) {
      console.error('Exception copying to Google Docs:', error);
      this.showNotification('Error: ' + error.message);
    }
  }

  async handleMessage(request, sendResponse) {
    switch (request.action) {
      case 'getHighlights':
        sendResponse({ highlights: this.highlights });
        break;

      case 'clearHighlights':
        await this.clearHighlights();
        sendResponse({ success: true });
        break;

      case 'changeColor':
        this.currentColor = request.color;
        sendResponse({ success: true });
        break;

      case 'exportHighlights':
        const exported = this.exportHighlights();
        sendResponse({ data: exported });
        break;
    }
  }

  async clearHighlights() {
    // Remove highlight spans from DOM
    const highlightSpans = document.querySelectorAll('.note-highlight');
    highlightSpans.forEach(span => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });

    // Clear from storage
    const url = window.location.href;
    const result = await chrome.storage.local.get(['highlights']);
    const allHighlights = result.highlights || {};
    delete allHighlights[url];
    await chrome.storage.local.set({ highlights: allHighlights });

    this.highlights = [];
    this.showNotification('All highlights cleared!');
  }

  exportHighlights() {
    return {
      url: window.location.href,
      title: document.title,
      highlights: this.highlights,
      exportDate: new Date().toISOString()
    };
  }

  createHighlightMenu() {
    // This will be handled by the background script
  }

  generateId() {
    return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'note-highlighter-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// Initialize the highlighter
const highlightManager = new HighlightManager();
