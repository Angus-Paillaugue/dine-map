#!/usr/bin/env bash

# Variables
app_name="dine-map"
project_dir="$(builtin cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
release_branch="main"

get_latest_version() {
  local latest_version
  latest_version=$(curl -s "https://raw.githubusercontent.com/Angus-Paillaugue/$app_name/refs/heads/$release_branch/VERSION")
  strip_latest_version="$(echo "$latest_version" | grep -Eo '^[0-9]+\.[0-9]+\.[0-9]+')"
  echo "$strip_latest_version"
}

get_local_version() {
  local local_version
  file_path="$project_dir/VERSION"
  if [[ -f "$file_path" ]]; then
    local_version=$(cat "$file_path")
  else
    local_version="0.0.0" # Default version if file does not exist
  fi
  echo "$local_version"
}


project_dir="$(builtin cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

current_local_version=$(get_local_version)
current_latest_version=$(get_latest_version)

if [[ -z "$current_latest_version" ]]; then
  echo "Error: Unable to fetch the latest version."
  exit 1
fi

if [[ -z "$current_local_version" ]]; then
  echo "Error: Local version file not found."
  exit 1
fi

update_versions_in_files() {
  local new_version="$1"

  echo "$new_version" > "$project_dir/VERSION"
  # Update version in package.json
  sed -i -E "s/\"version\": \"[0-9]+\.[0-9]+\.[0-9]+\"/\"version\": \"$new_version\"/" "$project_dir/package.json"
}

main() {
  git checkout "$release_branch" || {
    echo "Error: Unable to checkout the release branch '$release_branch'."
    exit 1
  }
  git pull origin "$release_branch" || {
    echo "Error: Unable to pull the latest changes from the release branch '$release_branch'."
    exit 1
  }
  local new_version
  read -p "Enter the new version (current: $current_local_version, latest: $current_latest_version): " new_version
  bump_branch="version-bump-$new_version"
  git checkout -b "$bump_branch" || {
    echo "Error: Unable to create a new branch for version bump."
    exit 1
  }
  if [[ -z "$new_version" ]]; then
    echo "No version entered. Exiting."
    exit 0
  fi
  if [[ "$new_version" == "$current_local_version" ]]; then
    echo "The new version is the same as the current version. No changes made."
    exit 0
  fi
  if ! [[ "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Invalid version format. Please use semantic versioning (e.g., 1.0.0)."
    exit 1
  fi
  update_versions_in_files "$new_version"

  # Commit and push the changes
  git add .
  git commit -m "Bump version to $new_version"
  git push origin "$bump_branch"

  # Create a pull request
  gh pr create --base "$release_branch" --head "$bump_branch" --title "Version Bump to $new_version" --body "This PR bumps the version to $new_version."
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to create a pull request."
    exit 1
  fi

  # Wait for tests to pass before merging
  echo "Waiting for workflows to pass..."
  gh pr checks "$bump_branch" --watch
  if [[ $? -ne 0 ]]; then
    echo "Error: Tests did not pass."
    exit 1
  fi

  # Merge the pull request
  gh pr merge --squash "$bump_branch"
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to merge the pull request."
    exit 1
  fi

  # Clean up local branch
  git checkout "$release_branch"
  git pull origin "$release_branch"
  git branch -D "$bump_branch"
  git push origin --delete "$bump_branch"

  # Create a github release
  gh release create "$new_version" --generate-notes || {
    echo "Error: Failed to create a GitHub release."
    exit 1
  }
  echo "Version bumped to $new_version and released."
}

main "$@"
