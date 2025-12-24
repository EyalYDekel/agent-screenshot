// Store last filename in memory (session-only)
let lastFilename = '';

// Debounce flag to prevent rapid DOM changes
let isProcessing = false;

// Check if extension APIs are available
if (typeof chrome === 'undefined' || !chrome.runtime) {
  console.error('Content: Chrome extension APIs not available. Make sure the extension is loaded.');
}

// Safe DOM manipulation using requestAnimationFrame
function safeDOMUpdate(callback) {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  } else {
    setTimeout(callback, 16); // Fallback to ~60fps timing
  }
}

// Create and inject floating button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'atlas-screenshot-trigger';
  button.textContent = 'AgentScreenShot';
  button.setAttribute('data-status', 'idle');
  button.addEventListener('click', handleFloatingButtonClick);
  document.body.appendChild(button);
}

// Create and inject naming overlay
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'atlas-screenshot-overlay';
  overlay.style.visibility = 'hidden';
  overlay.style.opacity = '0';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'atlas-screenshot-filename';
  input.value = lastFilename;
  input.placeholder = 'Enter filename (or leave empty for "untitled")';
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleConfirmClick();
    }
  });
  
  const confirmButton = document.createElement('button');
  confirmButton.id = 'atlas-screenshot-confirm';
  confirmButton.textContent = 'Take';
  confirmButton.addEventListener('click', handleConfirmClick);
  
  overlay.appendChild(input);
  overlay.appendChild(confirmButton);
  document.body.appendChild(overlay);
}

// Handle floating button click
function handleFloatingButtonClick() {
  if (isProcessing) {
    return; // Prevent rapid clicks
  }
  
  // Check if extension is still valid
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    const button = document.getElementById('atlas-screenshot-trigger');
    if (button) {
      safeDOMUpdate(() => {
        updateButtonStatus('fail', 'Extension context invalidated. Please reload the page.');
      });
    }
    return;
  }
  
  const button = document.getElementById('atlas-screenshot-trigger');
  const overlay = document.getElementById('atlas-screenshot-overlay');
  const input = document.getElementById('atlas-screenshot-filename');
  
  if (!button || !overlay || !input) {
    return;
  }
  
  // Reset to idle state
  button.setAttribute('data-status', 'idle');
  button.textContent = 'AgentScreenShot';
  button.style.color = '';
  button.style.backgroundColor = '';
  
  // Use safe DOM update to hide button and show overlay
  // Add delays to avoid conflicts with browser UI update cycles
  safeDOMUpdate(() => {
    button.style.visibility = 'hidden';
    button.style.opacity = '0';
    
    // Wait for button to hide before showing overlay
    setTimeout(() => {
      safeDOMUpdate(() => {
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        
        // Focus input after overlay is visible and settled
        setTimeout(() => {
          safeDOMUpdate(() => {
            input.value = lastFilename;
            input.focus();
            input.select();
          });
        }, 100);
      });
    }, 100);
  });
}

// Handle confirm button click
async function handleConfirmClick() {
  // Prevent rapid clicks
  if (isProcessing) {
    return;
  }
  isProcessing = true;
  
  // Check if chrome.runtime is available FIRST, before doing anything else
  if (typeof chrome === 'undefined' || !chrome || !chrome.runtime) {
    console.error('Content: chrome.runtime is not available. Extension may not be loaded properly.');
    console.error('Content: chrome object:', typeof chrome !== 'undefined' ? chrome : 'undefined');
    isProcessing = false;
    updateButtonStatus('fail', 'Extension not loaded - please reload the extension in chrome://extensions');
    return;
  }
  
  const overlay = document.getElementById('atlas-screenshot-overlay');
  const input = document.getElementById('atlas-screenshot-filename');
  const button = document.getElementById('atlas-screenshot-trigger');
  
  if (!overlay || !input || !button) {
    isProcessing = false;
    return;
  }
  
  const filename = input.value.trim() || 'untitled';
  lastFilename = filename;
  
  // Use safe DOM update to close overlay and show button
  // Add significant delays to avoid conflicts with Atlas browser UI update cycles
  safeDOMUpdate(() => {
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    
    // Wait longer for overlay to hide and UI to settle
    // This is critical to prevent crashes in Atlas agent mode
    setTimeout(() => {
      safeDOMUpdate(() => {
        safeDOMUpdate(() => {
          button.style.visibility = 'visible';
          button.style.opacity = '1';
          
          // Wait before updating button status to ensure UI is stable
          setTimeout(() => {
            safeDOMUpdate(() => {
              updateButtonStatus('processing');
            });
          }, 50);
        });
      });
    }, 200); // Increased delay for Atlas stability
  });
  
  console.log('Content: Sending captureScreenshot request for filename:', filename);
  
  // Wait for DOM updates to complete and UI to settle
  // Use multiple requestAnimationFrame calls and longer delay to ensure all updates are processed
  // This is critical to avoid crashes in Atlas browser during UI update cycles
  await new Promise(resolve => {
    safeDOMUpdate(() => {
      safeDOMUpdate(() => {
        safeDOMUpdate(() => {
          // Longer delay to ensure UI update cycle completes, especially in agent mode
          setTimeout(resolve, 300); // Increased delay for Atlas browser stability
        });
      });
    });
  });
  
  console.log('Content: chrome.runtime available:', !!chrome.runtime);
  
  // Set timeout in case response never arrives
  let responseReceived = false;
  const timeout = setTimeout(() => {
      if (!responseReceived) {
        console.error('Content: Timeout waiting for response from background script');
        isProcessing = false;
        safeDOMUpdate(() => {
          updateButtonStatus('fail', 'Request timed out - no response from extension');
        });
      }
  }, 30000); // 30 second timeout
  
  // Check if extension is still valid before sending message
  if (!chrome.runtime || !chrome.runtime.id) {
    isProcessing = false;
    safeDOMUpdate(() => {
      updateButtonStatus('fail', 'Extension context invalidated. Please reload the page.');
    });
    return;
  }
  
  // Send message to background script
  try {
    chrome.runtime.sendMessage(
      { action: 'captureScreenshot', filename: filename },
      (response) => {
        responseReceived = true;
        clearTimeout(timeout);
        
        console.log('Content: Received response:', response);
        
        // Check for runtime errors first (including invalidated context)
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || 'Connection error';
          console.error('Content: Runtime error:', errorMsg);
          isProcessing = false;
          
          // Check if it's an invalidated context error
          let userFriendlyError = errorMsg;
          if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('message port closed')) {
            userFriendlyError = 'Extension was reloaded. Please refresh the page.';
          }
          
          safeDOMUpdate(() => {
            updateButtonStatus('fail', userFriendlyError);
          });
          return;
        }
        
        // Handle undefined or null response
        if (response === undefined || response === null) {
          console.error('Content: Response is undefined or null');
          isProcessing = false;
          safeDOMUpdate(() => {
            updateButtonStatus('fail', 'No response received from extension');
          });
          return;
        }
        
        // Handle success case
        if (response.success === true) {
          console.log('Content: Screenshot captured successfully');
          isProcessing = false;
          safeDOMUpdate(() => {
            updateButtonStatus('success');
          });
          return;
        }
        
        // Handle error case - extract error message
        let errorMsg = 'Unknown error';
        if (response.error) {
          errorMsg = response.error;
          if (response.errorDetails) {
            console.error('Content: Error details:', response.errorDetails);
          }
        } else if (typeof response === 'string') {
          errorMsg = response;
        } else if (response.message) {
          errorMsg = response.message;
        }
        
        console.error('Content: Screenshot failed with error:', errorMsg);
        isProcessing = false;
        safeDOMUpdate(() => {
          updateButtonStatus('fail', errorMsg);
        });
      }
    );
  } catch (error) {
    responseReceived = true;
    clearTimeout(timeout);
    isProcessing = false;
    let errorMsg = error.message || 'Failed to send message to extension';
    console.error('Content: Exception sending message:', error);
    
    // Check if it's an invalidated context error
    if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('message port closed')) {
      errorMsg = 'Extension was reloaded. Please refresh the page.';
    }
    
    safeDOMUpdate(() => {
      updateButtonStatus('fail', `Send error: ${errorMsg}`);
    });
  }
}

// Update button status in DOM
function updateButtonStatus(status, errorMessage = '') {
  const button = document.getElementById('atlas-screenshot-trigger');
  
  if (!button) {
    console.error('Content: Button not found when trying to update status');
    return;
  }
  
  button.setAttribute('data-status', status);
  
  if (status === 'success') {
    button.textContent = 'AgentScreenShot Success';
    button.style.color = 'white';
    button.style.backgroundColor = 'green';
    button.removeAttribute('data-error');
    button.title = '';
    console.log('Content: Button status updated to success');
  } else if (status === 'fail') {
    button.textContent = 'fail';
    button.style.color = 'white';
    button.style.backgroundColor = 'red';
    const finalErrorMessage = errorMessage || 'Unknown error occurred';
    button.setAttribute('data-error', finalErrorMessage);
    button.setAttribute('title', finalErrorMessage); // Show error on hover
    console.error('Content: Button status updated to fail with error:', finalErrorMessage);
    console.log('Content: Button data-error attribute:', button.getAttribute('data-error'));
    console.log('Content: Button title attribute:', button.getAttribute('title'));
  } else if (status === 'processing') {
    button.textContent = 'AgentScreenShot™ - Chrome';
    button.style.color = 'white';
    button.style.backgroundColor = '#666';
    button.removeAttribute('data-error');
    button.title = 'Processing screenshot...';
    console.log('Content: Button status updated to processing');
  } else {
    // idle state
    button.textContent = 'AgentScreenShot';
    button.style.color = '';
    button.style.backgroundColor = '';
    button.removeAttribute('data-error');
    button.title = '';
  }
}

// Initialize when DOM is ready
if (document.body) {
  createFloatingButton();
  createOverlay();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    createFloatingButton();
    createOverlay();
  });
}

