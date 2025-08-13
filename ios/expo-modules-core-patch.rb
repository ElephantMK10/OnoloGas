#!/usr/bin/env ruby

# Patch for expo-modules-core Swift compilation error with Xcode 15.1+
# Fixes: "protocol 'WithHostingView' cannot be nested inside another declaration"

require 'fileutils'

def patch_expo_modules_core
  hosting_view_path = '../node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift'
  
  if File.exist?(hosting_view_path)
    puts "Patching SwiftUIHostingView.swift..."
    
    content = File.read(hosting_view_path)
    
    # Move the protocol outside of the class
    # Find the nested protocol and move it to the top level
    if content.include?('public protocol WithHostingView {')
      # Extract the protocol definition
      protocol_match = content.match(/(\s+public protocol WithHostingView \{[^}]*\})/m)
      
      if protocol_match
        protocol_def = protocol_match[1].strip
        
        # Remove the nested protocol from inside the class
        content.gsub!(protocol_match[0], '')
        
        # Add the protocol at the top level (after imports)
        import_section = content.match(/(import [^\n]+\n)+/m)
        if import_section
          insert_pos = import_section.end(0)
          content.insert(insert_pos, "\n#{protocol_def}\n\n")
        end
        
        File.write(hosting_view_path, content)
        puts "✅ Successfully patched SwiftUIHostingView.swift"
      else
        puts "⚠️ Could not find protocol definition to patch"
      end
    else
      puts "ℹ️ SwiftUIHostingView.swift already patched or different version"
    end
  else
    puts "⚠️ SwiftUIHostingView.swift not found at expected path"
  end
  
  # Also fix the PersistentFileLog warning about unnecessary 'try'
  log_path = '../node_modules/expo-modules-core/ios/Core/Logging/PersistentFileLog.swift'
  
  if File.exist?(log_path)
    puts "Patching PersistentFileLog.swift..."
    
    content = File.read(log_path)
    
    # Remove unnecessary 'try' keyword
    if content.include?('try fileHandle.write(data)')
      content.gsub!('try fileHandle.write(data)', 'fileHandle.write(data)')
      File.write(log_path, content)
      puts "✅ Successfully patched PersistentFileLog.swift"
    else
      puts "ℹ️ PersistentFileLog.swift already patched or different version"
    end
  end
end

# Run the patch
patch_expo_modules_core