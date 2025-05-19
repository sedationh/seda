# seda CLI

`seda` is SedationH's CLI toolkit for automating daily tasks.

## Features

- Clone a Git repository from a given URL
- Automatically open the cloned repository in Visual Studio Code
- Support for custom repository names
- Fallback to alternative URL format if initial clone fails (SSH ↔ HTTPS)
- Use a custom editor instead of VSCode (via environment variable)
- TypeScript implementation with full type safety

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git
- Visual Studio Code (or your preferred editor)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sedationh/seda_cli.git
   cd seda_cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Install globally:
   ```bash
   npm install -g .
   ```

## Usage

### `seda code`

Clone a GitHub repository and open it in VSCode:

```bash
seda code <repository_url> [new_name]
```

- `<repository_url>`: The URL of the GitHub repository you want to clone (supports both HTTPS and SSH formats)
- `[new_name]`: (Optional) A new name for the cloned directory

Examples:
```bash
# Clone using HTTPS URL
seda code https://github.com/example/repo.git

# Clone using SSH URL
seda code git@github.com:example/repo.git

# Clone with custom directory name
seda code https://github.com/example/repo.git my-project
```

## Development

- Run in development mode:
  ```bash
  npm run dev
  ```

- Run tests:
  ```bash
  npm test
  ```

- Lint code:
  ```bash
  npm run lint
  ```

- Format code:
  ```bash
  npm run format
  ```

## Project Structure

```
src/
├── commands/        # CLI commands
│   └── code.ts     # Code command implementation
├── utils/          # Utility functions
│   ├── editor.ts   # Editor-related utilities
│   └── git.ts      # Git-related utilities
├── types.ts        # TypeScript type definitions
└── index.ts        # Main entry point
```

## Environment Variables

- `VSCODE_ALTERNATIVE`: Set a custom editor to replace VSCode. For example:
  ```sh
  export VSCODE_ALTERNATIVE=cursor
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

SedationH