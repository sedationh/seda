# Seda CLI

A Go-based CLI toolkit for managing Git repositories and development workflows.

## Features

- Clone a Git repository from a given URL
- Automatically open the cloned repository in Visual Studio Code
- Support for custom repository names
- Use a custom editor instead of VSCode (via environment variable)

## Prerequisites

- Go 1.16 or later
- Git
- Visual Studio Code (or another editor of your choice)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sedationh/seda-cli.git
cd seda-cli
```

2. Build and install:
```bash
go install
```

## Usage

### `seda code`

Clone a GitHub repository and open it in VSCode:

```bash
seda code <repository_url> [new_name]
```

- `<repository_url>`: The URL of the GitHub repository you want to clone.
- `[new_name]`: (Optional) A new name for the cloned directory.

Example:
```bash
seda code https://github.com/example/repo.git my-project
```

## Environment Variables

- `VSCODE_ALTERNATIVE`: Set a custom editor to replace VSCode. For example:
```bash
export VSCODE_ALTERNATIVE=cursor
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

SedationH 