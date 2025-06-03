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
- pnpm
- Git
- Visual Studio Code (or your preferred editor)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sedationh/seda.git
   cd seda
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
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

### `seda degit`
Clone repositories without git history (inspired by [degit](https://github.com/Rich-Harris/degit)).

#### Direct Mode
Clone a specific repository:
```bash
seda degit https://github.com/user/repo [destination]
seda degit https://github.com/user/repo my-project
```

#### Interactive Mode
Choose from previously cloned repositories:
```bash
seda degit [destination]
```

#### Options
- `-f, --force`: Overwrite existing files
- `-v, --verbose`: Verbose output

#### Features
- ✅ Fast cloning without git history
- ✅ Automatic caching of downloaded archives
- ✅ Interactive mode with repository history
- ✅ Support for GitHub repositories
- ✅ Support for specific branches/tags/commits using `#ref` syntax

#### Examples
```bash
# Clone to current directory
seda degit https://github.com/Rich-Harris/degit

# Clone to specific directory
seda degit https://github.com/Rich-Harris/degit my-project

# Clone specific branch
seda degit https://github.com/Rich-Harris/degit#dev my-project

# Interactive mode
seda degit

# Interactive mode with destination
seda degit my-project

# Verbose output
seda degit https://github.com/Rich-Harris/degit my-project -v
```

## Development

- Run in development mode:
  ```bash
  pnpm dev
  ```

- Run tests:
  ```bash
  pnpm test
  ```

- Lint code:
  ```bash
  pnpm lint
  ```

- Format code:
  ```bash
  pnpm format
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