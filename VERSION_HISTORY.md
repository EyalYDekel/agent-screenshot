# Version History

## Version 1.0.0 (Stable Release)
**Date:** Current stable version

### Features:
- Floating button "AgentScreenShot" in bottom-right corner
- Horizontal filename input bar (replaces button when active)
- Automatic "untitled" filename if empty
- Success state: "AgentScreenShot Success" (green)
- Processing state: "AgentScreenShot™ - Chrome" (gray)
- Error handling with detailed messages
- Screenshot capture with proper permissions (`<all_urls>`)
- 100ms delay after closing overlay before screenshot

### Technical Details:
- Manifest V3
- Permissions: `tabs`, `downloads`, `windows`
- Host permissions: `<all_urls>`
- Uses `chrome.tabs.captureVisibleTab` with window ID
- Session-only filename memory

### Known Working:
- Screenshot capture works reliably
- Filename handling (empty = "untitled")
- UI states (idle, processing, success, fail)
- Overlay positioning and behavior

---

## Version 1.1.0 (Development)
**Status:** In development - Current working version

### Changes from 1.0.0:
- (Changes will be documented here as they are made)

### To restore version 1.0.0:
If something breaks, you can restore the stable version by:
1. Copy files from `SSAgent-v1.0.0-stable/` back to `SSAgent/`
2. Or reload the extension from `SSAgent-v1.0.0-stable/` directory

