# Minesweeper

## About

Inspired by classic minesweeper, implemented now as a cross platform desktop interface. So far basic features are available, which already cover the ones of the original game.

## Why

This is built for people who want to play minesweeper on the go, without searching for a version online, while also being able to choose to play a version close enough to the original game.

## Future releases

Future releases will include mostly modern QoL features such as non guessing mode.

## Development

Run the development server:
```bash
pnpm tauri dev
```

### Testing with Different Languages

The application automatically detects your system language. To test with a specific language during development, you can override the language using the `LANG` environment variable:

**Linux/macOS:**
```bash
LANG=es pnpm tauri dev  # Spanish
LANG=en pnpm tauri dev  # English
```

**Windows (PowerShell):**
```powershell
$env:LANG="es"; pnpm tauri dev  # Spanish
$env:LANG="en"; pnpm tauri dev  # English
```

Currently supported languages:
- `en` - English
- `es` - Spanish

## Building

Build the application:
```bash
pnpm tauri build
