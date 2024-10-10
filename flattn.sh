#!/bin/bash

# Script to flatten a Git repository to a single commit

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Error: This is not a git repository"
    exit 1
fi

# Ensure we're in the root of the git repository
# This is important because the script needs to operate on the entire repo
cd "$(git rev-parse --show-toplevel)"

# Create a temporary branch
# --orphan creates a new branch with no parents (i.e., no history)
git checkout --orphan temp_branch

# Commit the changes
# -am allows us to add a commit message directly
# This creates our single, flattened commit
git commit -am "Flattened repository - Contains all previous work"

# Delete the main branch
# -D forces the deletion even if there are unmerged changes
git branch -D main

# Rename the temporary branch to main
# -m is used to move/rename a branch
git branch -m main

echo "Repository has been flattened to a single commit."
echo "Note: Changes are only local. Use 'git push -f origin main' to update the remote repository if desired."
