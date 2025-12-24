# Agent ScreenShot

A Chrome Extension designed for autonomous screenshot capture by browser agents such as Atlas. The extension provides a minimal, agent-friendly interface that allows automated tools to capture screenshots without any system dialogs or user interaction.

## Features

- **Floating UI Element**: Always-visible button in the bottom-right corner
- **Autonomous Operation**: No user interaction required once installed
- **DOM-Based Interface**: All interactions via DOM state (perfect for automation)
- **Status Signaling**: Clear success/failure indicators via DOM attributes
- **Context Menu**: Quick access to About and Prompt Starters

## Installation

### From Chrome Web Store
(Coming soon)

### Manual Installation (Development)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the repository folder

## Usage

1. Navigate to any webpage (http:// or https://)
2. Click the "AgentScreenShot" button in the bottom-right corner
3. Enter a filename (or leave empty for "untitled")
4. Click "Take" or press Enter
5. The screenshot will be saved to your Downloads folder

### For Automated Agents

The extension is designed to work with automated browser agents:

- **Button ID**: `atlas-screenshot-trigger` (stable selector)
- **Status Attribute**: `data-status` ("idle" | "processing" | "success" | "fail")
- **Error Attribute**: `data-error` (contains error message on failure)
- **Text Content**: Changes to reflect current state

Example agent interaction:
```javascript
// Click the button
document.getElementById('atlas-screenshot-trigger').click();

// Wait for overlay, enter filename
document.getElementById('atlas-screenshot-filename').value = 'my-screenshot';
document.getElementById('atlas-screenshot-confirm').click();

// Check status
const status = document.getElementById('atlas-screenshot-trigger').getAttribute('data-status');
if (status === 'success') {
  // Screenshot captured successfully
}
```

## Context Menu

Right-click anywhere on a webpage to access:
- **About**: Opens the GitHub repository
- **Prompt Starters**: Opens GitHub Discussions for prompt examples

## Permissions

- `tabs`: Required to identify and capture the active tab
- `downloads`: Required to save screenshot files locally
- `windows`: Required to identify the correct window for capture
- `<all_urls>`: Required to capture screenshots on any website

## Technical Details

- **Manifest Version**: 3
- **Browser Support**: Chrome/Chromium (Manifest V3 compatible)
- **File Format**: PNG (automatic)
- **Storage**: Session-only (filename memory)

## Development

### Project Structure

```
agent-screenshot/
├── manifest.json      # Extension configuration
├── background.js      # Service worker (screenshot capture)
├── content.js         # Content script (UI injection)
├── styles.css         # UI styling
└── README.md          # This file
```

### Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For prompt starters and examples, visit our [Discussions](https://github.com/EyalYDekel/agent-screenshot/discussions).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/EyalYDekel/agent-screenshot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/EyalYDekel/agent-screenshot/discussions)

## Privacy

This extension does not collect, store, or transmit any user data. All operations are performed locally on your device. Screenshots are saved only to your local Downloads folder.

