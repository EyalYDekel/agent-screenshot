# Changelog

All notable changes to Agent ScreenShot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-24

### Added
- Context menu with "About" and "Prompt Starters" options
- GitHub integration (repository and discussions links)
- Improved error handling for extension context invalidation
- CSS isolation to prevent browser UI conflicts
- Extended delays for Atlas browser stability
- Debouncing to prevent rapid DOM changes

### Changed
- Extension name changed to "Agent ScreenShot"
- Improved DOM manipulation using requestAnimationFrame
- Changed from display to visibility for better UI compatibility
- Increased delays for screenshot capture (300ms)

### Fixed
- Fixed browser crashes in Atlas agent mode
- Fixed extension context invalidation errors
- Improved stability during UI update cycles

## [1.0.0] - 2025-12-24

### Added
- Initial release
- Floating button "AgentScreenShot" in bottom-right corner
- Horizontal filename input bar
- Automatic "untitled" filename if empty
- Success state: "AgentScreenShot Success" (green)
- Processing state: "AgentScreenShot™ - Chrome" (gray)
- Error handling with detailed messages
- Screenshot capture with proper permissions
- 100ms delay after closing overlay before screenshot

### Technical Details
- Manifest V3
- Permissions: `tabs`, `downloads`, `windows`
- Host permissions: `<all_urls>`
- Uses `chrome.tabs.captureVisibleTab` with window ID
- Session-only filename memory

