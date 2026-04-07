#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/update-cask.sh <version>"
  echo "Example: ./scripts/update-cask.sh 0.0.3"
  exit 1
fi

DMG_URL="https://github.com/blchelle/rye/releases/download/v${VERSION}/Rye-${VERSION}-arm64.dmg"

echo "Downloading DMG to calculate SHA256..."
curl -L -o /tmp/Rye.dmg "$DMG_URL"
SHA256=$(shasum -a 256 /tmp/Rye.dmg | awk '{print $1}')
rm /tmp/Rye.dmg

echo "Version: $VERSION"
echo "SHA256: $SHA256"

# Clone tap repo
cd /tmp
rm -rf homebrew-tap
git clone git@github.com:blchelle/homebrew-tap.git
cd homebrew-tap

# Update cask
cat > Casks/rye.rb << EOF
cask "rye" do
  version "$VERSION"
  sha256 "$SHA256"

  url "https://github.com/blchelle/rye/releases/download/v#{version}/Rye-#{version}-arm64.dmg"
  name "Rye"
  desc "Eye rest reminder app"
  homepage "https://github.com/blchelle/rye"

  app "Rye.app"

  zap trash: [
    "~/Library/Application Support/rye",
    "~/Library/Preferences/com.rye.eyerest.plist",
  ]
end
EOF

# Commit and push
git add Casks/rye.rb
git commit -m "Update rye to $VERSION"
git push

echo "✓ Cask updated to $VERSION"
