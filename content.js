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

    if (selectedText.length === 0) return;

    // Show highlight button near selection
    this.showHighlightButton(e.pageX, e.pageY, selection);
  }

  showHighlightButton(x, y, selection) {
    // Remove existing button if any
    const existingBtn = document.getElementById('highlight-btn');
    if (existingBtn) existingBtn.remove();

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

    document.body.appendChild(button);

    // Add click handlers
    document.getElementById('do-highlight').addEventListener('click', () => {
      this.highlightSelection(selection);
      button.remove();
    });

    document.getElementById('copy-to-docs').addEventListener('click', () => {
      this.copyToGoogleDocs(selection.toString());
      button.remove();
    });

    // Remove button when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', function removeBtn(e) {
        if (!button.contains(e.target)) {
          button.remove();
          document.removeEventListener('click', removeBtn);
        }
      });
    }, 100);
  }

  highlightSelection(selection) {
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText) return;

    // Create highlight data
    const highlightData = {
      text: selectedText,
      color: this.currentColor,
      timestamp: Date.now(),
      id: this.generateId()
    };

    // Wrap selection in highlight span
    const span = document.createElement('span');
    span.className = 'note-highlight';
    span.setAttribute('data-highlight-id', highlightData.id);
    span.style.backgroundColor = this.currentColor;

    try {
      range.surroundContents(span);

      // Add click handler to copy this highlight
      span.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          this.copyToGoogleDocs(highlightData.text);
        }
      });

      // Save highlight
      this.saveHighlight(highlightData);

      // Clear selection
      selection.removeAllRanges();
    } catch (e) {
      console.error('Error applying highlight:', e);
      this.showNotification('Could not highlight this selection. Try a simpler text selection.');
    }
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
    // Send message to background script to handle Google Docs API
    chrome.runtime.sendMessage({
      action: 'copyToGoogleDocs',
      text: text
    }, (response) => {
      if (response && response.success) {
        this.showNotification('Copied to Google Docs!');
      } else {
        this.showNotification('Failed to copy to Google Docs. Please check permissions.');
      }
    });
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
