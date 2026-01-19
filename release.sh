#!/bin/bash
set -e

if [[ ! "$1" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: $0 <patch|minor|major>"
  exit 1
fi

version=$(grep '"version"' package.json | head -1 | sed 's/.*"\([0-9]*\.[0-9]*\.[0-9]*\)".*/\1/')
IFS='.' read -r major minor patch <<< "$version"

case $1 in
  patch) patch=$((patch + 1)) ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  major) major=$((major + 1)); minor=0; patch=0 ;;
esac

new_version="$major.$minor.$patch"

sed -i.bak "s/\"version\": \"$version\"/\"version\": \"$new_version\"/" package.json && rm package.json.bak
sed -i.bak "s/^version = \"$version\"/version = \"$new_version\"/" Cargo.toml && rm Cargo.toml.bak

git add package.json Cargo.toml
git commit -m "chore: release v$new_version"
git tag "v$new_version"
git push && git push --tags

echo "Released v$new_version"
