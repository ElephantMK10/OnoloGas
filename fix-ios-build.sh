#!/bin/bash

echo "🔧 Fixing iOS build setup..."

# Fix directory permissions
echo "📁 Fixing directory permissions..."
sudo chown -R selakekana /usr/local/bin
chmod u+w /usr/local/bin

# Install Ruby via Homebrew
echo "💎 Installing Ruby..."
brew install ruby

# Add Ruby to PATH
echo "🔄 Adding Ruby to PATH..."
echo 'export PATH="/usr/local/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify Ruby
echo "✅ Checking Ruby version..."
ruby --version
which ruby

# Install CocoaPods
echo "📱 Installing CocoaPods..."
gem install cocoapods

# Verify CocoaPods
echo "✅ Checking CocoaPods..."
pod --version

# Install pods for the project
echo "📦 Installing iOS dependencies..."
cd ios
pod install

echo "🎉 iOS build setup complete!"
echo "Now you can open: ios/OnoloGas.xcworkspace in Xcode"
