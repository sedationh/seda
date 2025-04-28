package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "seda",
	Short: "SedationH's CLI toolkit",
	Long:  `A CLI tool for managing Git repositories and development workflows.`,
}

var codeCmd = &cobra.Command{
	Use:   "code [repository_url] [new_name]",
	Short: "Clone a repository and open it in VSCode",
	Long:  `Clone a Git repository from the given URL and open it in Visual Studio Code.`,
	Args:  cobra.RangeArgs(1, 2),
	Run: func(cmd *cobra.Command, args []string) {
		repoURL := args[0]
		var newName string
		if len(args) > 1 {
			newName = args[1]
		} else {
			// Extract repository name from URL
			parts := strings.Split(repoURL, "/")
			newName = strings.TrimSuffix(parts[len(parts)-1], ".git")
		}

		// Clone the repository
		cloneCmd := exec.Command("git", "clone", repoURL, newName)
		cloneCmd.Stdout = os.Stdout
		cloneCmd.Stderr = os.Stderr
		if err := cloneCmd.Run(); err != nil {
			fmt.Printf("Error cloning repository: %v\n", err)
			os.Exit(1)
		}

		// Get the absolute path of the cloned repository
		absPath, err := filepath.Abs(newName)
		if err != nil {
			fmt.Printf("Error getting absolute path: %v\n", err)
			os.Exit(1)
		}

		// Open in VSCode
		editor := os.Getenv("VSCODE_ALTERNATIVE")
		if editor == "" {
			editor = "code"
		}

		openCmd := exec.Command(editor, absPath)
		openCmd.Stdout = os.Stdout
		openCmd.Stderr = os.Stderr
		if err := openCmd.Run(); err != nil {
			fmt.Printf("Error opening in editor: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(codeCmd)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
