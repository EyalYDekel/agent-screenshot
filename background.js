// GitHub URLs
const GITHUB_REPO_URL = 'https://github.com/EyalYDekel/agent-screenshot'; // Main repository page (About section)
const GITHUB_DISCUSSIONS_URL = 'https://github.com/EyalYDekel/agent-screenshot/discussions?discussions_q=label%3APromptStarter';

// Create context menu items on extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'about',
    title: 'About Agent ScreenShot',
    contexts: ['all']
  });
  
  chrome.contextMenus.create({
    id: 'prompt-starters',
    title: 'Prompt Starters',
    contexts: ['all']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'about') {
    chrome.tabs.create({ url: GITHUB_REPO_URL });
  } else if (info.menuItemId === 'prompt-starters') {
    chrome.tabs.create({ url: GITHUB_DISCUSSIONS_URL });
  }
});

// Listen for screenshot capture requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    console.log('Background: Received captureScreenshot request for filename:', request.filename);
    
    // Safe sendResponse wrapper to handle connection issues
    let responseSent = false;
    const safeSendResponse = (result) => {
      if (!responseSent) {
        try {
          responseSent = true;
          sendResponse(result);
        } catch (err) {
          console.error('Background: Failed to send response:', err);
        }
      }
    };
    
    // Set timeout to ensure response is sent even if something hangs
    const timeout = setTimeout(() => {
      if (!responseSent) {
        console.error('Background: Timeout waiting for screenshot capture');
        safeSendResponse({ 
          success: false, 
          error: 'Screenshot capture timed out' 
        });
      }
    }, 30000); // 30 second timeout
    
    captureScreenshot(request.filename, sender.tab.id)
      .then((result) => {
        clearTimeout(timeout);
        console.log('Background: Screenshot result:', result);
        safeSendResponse(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        const errorMessage = error.message || 'Unknown error occurred';
        const errorStack = error.stack || '';
        console.error('Background: Screenshot error:', errorMessage);
        console.error('Background: Error stack:', errorStack);
        console.error('Background: Full error object:', error);
        
        // Check for permission-related errors
        let userFriendlyError = errorMessage;
        if (errorMessage.includes('permission') || errorMessage.includes('activeTab') || errorMessage.includes('Cannot access')) {
          userFriendlyError = 'Permission denied. Please ensure the extension has activeTab permission and reload the page.';
        }
        
        safeSendResponse({ 
          success: false, 
          error: userFriendlyError,
          errorDetails: errorStack.substring(0, 200) // First 200 chars of stack
        });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Capture screenshot and download
async function captureScreenshot(filename, tabId) {
  try {
    console.log('Background: Starting screenshot capture for tab:', tabId);
    console.log('Background: Available permissions - tabs:', !!chrome.tabs, 'windows:', !!chrome.windows);
    
    // Try to get the tab first to verify we have access
    let tab;
    try {
      tab = await chrome.tabs.get(tabId);
      console.log('Background: Tab found:', tab.url, 'Window ID:', tab.windowId);
    } catch (tabError) {
      console.error('Background: Error getting tab:', tabError);
      return {
        success: false,
        error: `Cannot access tab: ${tabError.message}`
      };
    }
    
    // Capture the visible tab in the window containing this tab
    // Using tab.windowId ensures we capture from the correct window
    // host_permissions (http://*/*, https://*/*) + tabs permission should provide access
    console.log('Background: Attempting to capture visible tab in window:', tab.windowId);
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });
    
    console.log('Background: Screenshot captured, data URL length:', dataUrl ? dataUrl.length : 0);
    
    if (!dataUrl) {
      return { 
        success: false, 
        error: 'Failed to capture screenshot - no data returned' 
      };
    }
    
    // Download the file using data URL directly
    // Append .png extension automatically
    const downloadFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
    
    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = (result) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };
      
      chrome.downloads.download({
        url: dataUrl,
        filename: downloadFilename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || 'Download failed';
          console.error('Background: Download error:', errorMsg);
          
          // Check for permission-related download errors
          let userFriendlyError = `Download failed: ${errorMsg}`;
          if (errorMsg.includes('permission') || errorMsg.includes('Cannot access')) {
            userFriendlyError = 'Download permission denied. Please check extension permissions.';
          }
          
          safeResolve({ 
            success: false, 
            error: userFriendlyError 
          });
        } else if (downloadId) {
          // Download initiated successfully
          // Monitor download completion/errors
          const listener = (delta) => {
            if (delta.id === downloadId) {
              if (delta.state && delta.state.current === 'complete') {
                chrome.downloads.onChanged.removeListener(listener);
                safeResolve({ success: true });
              } else if (delta.state && delta.state.current === 'interrupted') {
                chrome.downloads.onChanged.removeListener(listener);
                const error = delta.error ? `Download interrupted: ${delta.error.current}` : 'Download was interrupted';
                safeResolve({ 
                  success: false, 
                  error: error
                });
              }
            }
          };
          
          chrome.downloads.onChanged.addListener(listener);
          
          // Fallback: if download completes very quickly, resolve after short delay
          setTimeout(() => {
            if (resolved) return;
            chrome.downloads.onChanged.removeListener(listener);
            // Check if download still exists (might have completed)
            chrome.downloads.search({ id: downloadId }, (results) => {
              if (resolved) return;
              if (results && results.length > 0 && results[0].state === 'complete') {
                safeResolve({ success: true });
              } else if (results && results.length > 0 && results[0].state === 'interrupted') {
                safeResolve({ 
                  success: false, 
                  error: results[0].error || 'Download was interrupted' 
                });
              } else {
                // Assume success if no error was reported
                safeResolve({ success: true });
              }
            });
          }, 500);
        } else {
          safeResolve({ 
            success: false, 
            error: 'Download failed - no download ID returned' 
          });
        }
      });
    });
  } catch (error) {
    const errorMessage = error.message || 'Unknown error during screenshot capture';
    const errorStack = error.stack || '';
    console.error('Background: Screenshot capture failed:', errorMessage);
    console.error('Background: Error stack:', errorStack);
    console.error('Background: Full error object:', error);
    
    // Check for permission-related errors
    let userFriendlyError = errorMessage;
    if (errorMessage.includes('permission') || errorMessage.includes('activeTab') || errorMessage.includes('Cannot access')) {
      userFriendlyError = 'Permission denied. Please ensure the extension has activeTab permission and reload the page.';
    }
    
    return { 
      success: false, 
      error: userFriendlyError,
      errorDetails: errorStack.substring(0, 200) // First 200 chars of stack
    };
  }
}

