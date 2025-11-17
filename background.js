// Background service worker for Note Highlighter extension

let authToken = null;
let isAuthenticated = false;

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'highlightText',
    title: 'Highlight selected text',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'copyToGoogleDocs',
    title: 'Copy to Google Docs',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'highlightText') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'highlightSelection',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'copyToGoogleDocs') {
    copyToGoogleDocs(info.selectionText);
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
  console.log('Background: Received message:', request.action);

  switch (request.action) {
    case 'copyToGoogleDocs':
      try {
        const result = await copyToGoogleDocs(request.text, request.title);
        console.log('Background: Copy result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('Background: Copy error:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;

    case 'authenticate':
      const authResult = await authenticate();
      sendResponse(authResult);
      break;

    case 'checkAuth':
      sendResponse({ authenticated: isAuthenticated });
      break;

    case 'signOut':
      await signOut();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }
}

// Authentication with Google
async function authenticate() {
  try {
    console.log('Starting authentication...');

    // Get OAuth token
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome identity error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Token received successfully');
          resolve(token);
        }
      });
    });

    if (token) {
      authToken = token;
      isAuthenticated = true;
      console.log('Authentication successful');
      return { success: true, token: token };
    }

    console.error('No token received from Chrome identity API');
    return { success: false, error: 'No token received' };
  } catch (error) {
    console.error('Authentication error details:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    return { success: false, error: error.message || JSON.stringify(error) };
  }
}

async function signOut() {
  if (authToken) {
    await new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token: authToken }, () => {
        resolve();
      });
    });

    authToken = null;
    isAuthenticated = false;
  }
}

// Copy text to Google Docs
async function copyToGoogleDocs(text, title = 'Highlighted Notes') {
  try {
    // Check if authenticated
    if (!isAuthenticated || !authToken) {
      const authResult = await authenticate();
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }
    }

    // Check if there's a target document ID set
    const result = await chrome.storage.sync.get(['targetDocumentId']);
    const targetDocId = result.targetDocumentId;

    let documentId;

    if (targetDocId) {
      // Append to existing document
      documentId = targetDocId;
      console.log('DEBUG: Appending to existing document, will NOT open tab');
      const success = await appendToGoogleDoc(documentId, text, title);
      if (!success.success) {
        throw new Error(success.error || 'Failed to append to document');
      }

      console.log('DEBUG: Successfully appended, returning without opening tab');
      return { success: true, documentId: documentId, appended: true };
    }

    // Create a new Google Doc with the highlighted text
    const createDocResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `${title} - ${new Date().toLocaleDateString()}`
      })
    });

    if (!createDocResponse.ok) {
      throw new Error(`Failed to create document: ${createDocResponse.status}`);
    }

    const doc = await createDocResponse.json();
    documentId = doc.documentId;

    // Insert the highlighted text into the document
    const batchUpdateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: 1
                },
                text: text
              }
            }
          ]
        })
      }
    );

    if (!batchUpdateResponse.ok) {
      throw new Error(`Failed to update document: ${batchUpdateResponse.status}`);
    }

    console.log('DEBUG: Document created successfully, will NOT open tab');
    console.log('DEBUG: Returning success without chrome.tabs.create()');
    return { success: true, documentId: documentId };
  } catch (error) {
    console.error('Error copying to Google Docs:', error);

    // If authentication error, try to re-authenticate
    if (error.message.includes('401') || error.message.includes('auth')) {
      authToken = null;
      isAuthenticated = false;
    }

    return { success: false, error: error.message };
  }
}

// Alternative: Append to existing document
async function appendToGoogleDoc(documentId, text, title = 'Highlight') {
  try {
    if (!isAuthenticated || !authToken) {
      const authResult = await authenticate();
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }
    }

    // Get document info to find the end index
    const docResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (!docResponse.ok) {
      throw new Error(`Failed to get document: ${docResponse.status}`);
    }

    const docData = await docResponse.json();
    const endIndex = docData.body.content[docData.body.content.length - 1].endIndex - 1;

    // Format the text with timestamp and source
    const timestamp = new Date().toLocaleString();
    const separator = '─'.repeat(50);
    const formattedText = `\n\n${separator}\n📌 ${title}\n⏰ ${timestamp}\n${separator}\n\n${text}\n`;

    // Append text
    const batchUpdateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: endIndex
                },
                text: formattedText
              }
            }
          ]
        })
      }
    );

    if (!batchUpdateResponse.ok) {
      throw new Error(`Failed to update document: ${batchUpdateResponse.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error appending to Google Doc:', error);
    return { success: false, error: error.message };
  }
}

// Store default document ID for appending
async function setDefaultDocument(documentId) {
  await chrome.storage.sync.set({ defaultDocumentId: documentId });
}

async function getDefaultDocument() {
  const result = await chrome.storage.sync.get(['defaultDocumentId']);
  return result.defaultDocumentId;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    authenticate,
    copyToGoogleDocs,
    appendToGoogleDoc
  };
}
