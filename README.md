# seda CLI

A powerful command-line tool for cloning and managing git repositories with enhanced workflow features.

## Features

- 🚀 **Quick Repository Cloning** - Clone repositories with automatic editor integration
- 📦 **Degit Support** - Clone repositories without git history for faster downloads

## Installation

```bash
npm install -g @sedationh/cli
```

## Commands

### `seda code`

Clone a repository and open it in your editor.

```bash
seda code <repo-url> [new-name]
```

**Arguments:**
- `<repo-url>` - URL of the repository to clone (required)
- `[new-name]` - Custom name for the cloned directory (optional)

**Examples:**
```bash
# Clone a repository
seda code https://github.com/user/awesome-project

# Clone with a custom directory name
seda code https://github.com/user/awesome-project my-project

# If directory exists, just open it in editor
seda code https://github.com/user/existing-project
```

**Features:**
- Automatically opens the project in your configured editor after cloning
- If the target directory already exists, skips cloning and just opens the project
- Fallback mechanism tries alternative URL formats if the initial clone fails
- Smart error handling with detailed logging

### `seda degit`

Clone repositories without git history for faster downloads and cleaner project setup.

```bash
seda degit [repository] [destination]
```

**Arguments:**
- `[repository]` - Repository URL (optional for interactive mode)
- `[destination]` - Destination directory (default: current directory)

**Options:**
- `-f, --force` - Overwrite existing files in the destination directory
- `--no-git` - Skip git initialization and initial commit
- `--no-open` - Skip opening the project in your editor

**Examples:**
```bash
# Interactive mode - select from cached repositories
seda degit

# Interactive mode - select from cached repositories to specific directory
seda degit my-project

# Clone specific repository to current directory
seda degit https://github.com/user/template-project

# Clone to specific directory
seda degit https://github.com/user/template-project my-new-project

# Clone with options
seda degit https://github.com/user/template-project project --force --no-git

# Clone specific branch or tag
seda degit https://github.com/user/template-project#main
seda degit https://github.com/user/template-project#v1.0.0
```

**Features:**
- **Fast Cloning**: Downloads tar.gz archives instead of full git history
- **Branch/Tag Support**: Clone specific branches, tags, or commit hashes using `#ref` syntax
- **Repository Caching**: Automatically caches downloaded repositories for future use
- **Interactive Mode**: When no repository is specified, shows a list of cached repositories
- **Smart Extraction**: Automatically extracts and sets up the project structure
- **Git Integration**: Optionally initializes a new git repository with an initial commit
- **Editor Integration**: Automatically opens the project in your configured editor

## Configuration

The tool automatically detects and uses your preferred code editor. Supported editors include:
- Visual Studio Code
- Cursor
- And other popular editors

## Cache Management

Degit automatically caches downloaded repositories in:
- **macOS/Linux**: `~/.cache/seda/`
- **Windows**: `%LOCALAPPDATA%/seda/`

Cached repositories are reused for faster subsequent downloads and are available in interactive mode.

## URL Formats

Both commands support various repository URL formats:
- `https://github.com/user/repo`
- `git@github.com:user/repo.git`
- `github:user/repo`
- And more...

For degit, you can also specify branches, tags, or commits:
- `https://github.com/user/repo#main`
- `https://github.com/user/repo#v1.0.0`
- `https://github.com/user/repo#abc123`

## Use Cases

### Development Workflow (`seda code`)
Perfect for when you want to:
- Quickly clone and start working on a repository
- Maintain full git history for development
- Contribute to existing projects

### Project Scaffolding (`seda degit`)
Ideal for:
- Creating new projects from templates
- Fast project setup without git history
- Working with starter templates and boilerplates
- Situations where you want a clean slate

## Error Handling

Both commands include robust error handling:
- Automatic retry with alternative URL formats
- Clear error messages and suggestions
- Graceful handling of network issues
- Protection against overwriting existing files (unless `--force` is used)

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.
