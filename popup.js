// Popup script for Note Highlighter extension

let currentTab = null;
let currentColor = '#ffeb3b';
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  setupEventListeners();
  await loadHighlights();
  await checkAuthStatus();
  await loadTargetDocument();
});

async function initialize() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Load saved color preference
  const result = await chrome.storage.sync.get(['selectedColor']);
  if (result.selectedColor) {
    currentColor = result.selectedColor;
    updateColorSelection(currentColor);
  }
}

function setupEventListeners() {
  // Color picker
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const color = e.target.dataset.color;
      await selectColor(color);
    });
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', exportHighlights);

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', clearHighlights);

  // Copy all to docs button
  document.getElementById('copy-all-btn').addEventListener('click', copyAllToGoogleDocs);

  // Auth button
  document.getElementById('auth-btn').addEventListener('click', handleAuth);

  // Target document buttons
  document.getElementById('set-doc-btn').addEventListener('click', setTargetDocument);
  document.getElementById('clear-doc-btn').addEventListener('click', clearTargetDocument);
}

async function selectColor(color) {
  currentColor = color;
  updateColorSelection(color);

  // Save color preference
  await chrome.storage.sync.set({ selectedColor: color });

  // Send message to content script
  chrome.tabs.sendMessage(currentTab.id, {
    action: 'changeColor',
    color: color
  });
}

function updateColorSelection(color) {
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.color === color) {
      btn.classList.add('active');
    }
  });
}

async function loadHighlights() {
  if (!currentTab) return;

  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'getHighlights'
    });

    if (response && response.highlights) {
      displayHighlights(response.highlights);
    }
  } catch (error) {
    console.error('Error loading highlights:', error);
  }
}

function displayHighlights(highlights) {
  const list = document.getElementById('highlights-list');
  const count = document.getElementById('highlights-count');

  count.textContent = `${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}`;

  if (highlights.length === 0) {
    list.innerHTML = '<p class="empty-state">No highlights yet. Select text on the page to highlight!</p>';
    return;
  }

  list.innerHTML = highlights.map((highlight, index) => `
    <div class="highlight-item" data-index="${index}">
      <div class="highlight-text">${escapeHtml(highlight.text.substring(0, 100))}${highlight.text.length > 100 ? '...' : ''}</div>
      <div class="highlight-meta">
        <span style="background-color: ${highlight.color}; padding: 2px 8px; border-radius: 3px;">${new Date(highlight.timestamp).toLocaleString()}</span>
        <button class="highlight-delete" data-index="${index}">Delete</button>
      </div>
    </div>
  `).join('');

  // Add click handlers for delete buttons
  list.querySelectorAll('.highlight-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const index = parseInt(e.target.dataset.index);
      await deleteHighlight(index);
    });
  });

  // Add click handlers for highlight items (copy to clipboard)
  list.querySelectorAll('.highlight-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      copyHighlightToClipboard(highlights[index].text);
    });
  });
}

async function deleteHighlight(index) {
  // Get current highlights
  const url = currentTab.url;
  const result = await chrome.storage.sync.get(['highlights']);
  const allHighlights = result.highlights || {};

  if (allHighlights[url]) {
    allHighlights[url].splice(index, 1);
    await chrome.storage.sync.set({ highlights: allHighlights });
    await loadHighlights();

    // Reload the page to refresh highlights
    chrome.tabs.reload(currentTab.id);
  }
}

async function exportHighlights() {
  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'exportHighlights'
    });

    if (response && response.data) {
      // Export as formatted text with date grouping
      const formattedText = formatGroupedHighlights(response.data.highlights, currentTab.title);
      const exportContent = `Highlights from: ${response.data.url}\nPage Title: ${response.data.title}\nExported: ${new Date(response.data.exportDate).toLocaleString()}\n\n${'='.repeat(50)}\n${formattedText}`;

      const blob = new Blob([exportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `highlights_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();

      URL.revokeObjectURL(url);
      showNotification('Highlights exported!');
    }
  } catch (error) {
    console.error('Error exporting highlights:', error);
    showNotification('Failed to export highlights');
  }
}

async function clearHighlights() {
  if (!confirm('Are you sure you want to clear all highlights on this page?')) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'clearHighlights'
    });
    await loadHighlights();
    showNotification('All highlights cleared!');
  } catch (error) {
    console.error('Error clearing highlights:', error);
    showNotification('Failed to clear highlights');
  }
}

async function copyAllToGoogleDocs() {
  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'getHighlights'
    });

    if (response && response.highlights && response.highlights.length > 0) {
      // Use date-grouped formatting
      const formattedText = formatGroupedHighlights(response.highlights, currentTab.title);

      chrome.runtime.sendMessage({
        action: 'copyToGoogleDocs',
        text: formattedText,
        title: `Highlights from ${currentTab.title}`
      }, (result) => {
        if (result && result.success) {
          showNotification('All highlights copied to Google Docs!');
        } else {
          showNotification('Failed to copy to Google Docs');
        }
      });
    } else {
      showNotification('No highlights to copy');
    }
  } catch (error) {
    console.error('Error copying to Google Docs:', error);
    showNotification('Failed to copy to Google Docs');
  }
}

async function checkAuthStatus() {
  chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
    if (response && response.authenticated) {
      isAuthenticated = true;
      updateAuthUI(true);
    } else {
      isAuthenticated = false;
      updateAuthUI(false);
    }
  });
}

function updateAuthUI(authenticated) {
  const authStatus = document.getElementById('auth-status');
  const authMessage = document.getElementById('auth-message');
  const authBtn = document.getElementById('auth-btn');

  if (authenticated) {
    authStatus.classList.add('connected');
    authMessage.textContent = 'Connected to Google';
    authBtn.textContent = 'Disconnect';
  } else {
    authStatus.classList.remove('connected');
    authMessage.textContent = 'Not connected';
    authBtn.textContent = 'Connect Google';
  }
}

async function handleAuth() {
  if (isAuthenticated) {
    // Disconnect
    chrome.runtime.sendMessage({ action: 'signOut' }, () => {
      isAuthenticated = false;
      updateAuthUI(false);
      showNotification('Disconnected from Google');
    });
  } else {
    // Connect
    chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
      if (response && response.success) {
        isAuthenticated = true;
        updateAuthUI(true);
        showNotification('Connected to Google!');
      } else {
        showNotification('Authentication failed');
      }
    });
  }
}

function copyHighlightToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function showNotification(message) {
  // Simple notification - could be enhanced
  const count = document.getElementById('highlights-count');
  const originalText = count.textContent;
  count.textContent = message;
  count.style.background = '#4caf50';
  count.style.color = 'white';

  setTimeout(() => {
    count.textContent = originalText;
    count.style.background = '#f5f5f5';
    count.style.color = '#666';
  }, 2000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to group highlights by date
function groupHighlightsByDate(highlights) {
  const grouped = {};

  highlights.forEach(highlight => {
    const date = new Date(highlight.timestamp);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(highlight);
  });

  return grouped;
}

// Format grouped highlights as text with date headers
function formatGroupedHighlights(highlights, pageTitle) {
  const grouped = groupHighlightsByDate(highlights);
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  let formattedText = '';

  sortedDates.forEach(date => {
    formattedText += `\n📅 ${date}\n`;
    formattedText += '─'.repeat(50) + '\n\n';

    grouped[date].forEach((highlight, index) => {
      const time = new Date(highlight.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      formattedText += `• ${highlight.text}\n`;
      formattedText += `  ⏰ ${time} | 📄 ${pageTitle}\n\n`;
    });
  });

  return formattedText;
}

// Target Document Management
async function loadTargetDocument() {
  const result = await chrome.storage.sync.get(['targetDocumentId']);
  const docId = result.targetDocumentId;

  const statusDiv = document.getElementById('current-doc-status');
  const statusText = document.getElementById('doc-status-text');

  if (docId) {
    statusDiv.classList.add('active');
    statusText.textContent = `📄 Appending to: ${docId}`;
  } else {
    statusDiv.classList.remove('active');
    statusText.textContent = 'No document set - will create new docs';
  }
}

async function setTargetDocument() {
  const input = document.getElementById('doc-url-input');
  const urlOrId = input.value.trim();

  if (!urlOrId) {
    showNotification('Please enter a document URL or ID');
    return;
  }

  // Extract document ID from URL or use as-is if it's just an ID
  let docId = urlOrId;

  // Check if it's a full URL
  if (urlOrId.includes('docs.google.com')) {
    const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      docId = match[1];
    } else {
      showNotification('Invalid Google Docs URL');
      return;
    }
  }

  // Save the document ID
  await chrome.storage.sync.set({ targetDocumentId: docId });

  // Clear the input
  input.value = '';

  // Update the UI
  await loadTargetDocument();
  showNotification('Target document set!');
}

async function clearTargetDocument() {
  await chrome.storage.sync.remove('targetDocumentId');
  await loadTargetDocument();
  showNotification('Target document cleared');
}
