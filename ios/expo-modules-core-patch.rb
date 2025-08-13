#!/usr/bin/env ruby

# Patch for expo-modules-core Swift compilation errors with Xcode 15.1+
# Fixes multiple Swift compilation issues

require 'fileutils'

def patch_expo_modules_core
  puts "Starting ExpoModulesCore patches for Xcode 15.1 compatibility..."
  
  # Fix 1: Move nested protocol 'AnyChild' outside of its parent
  any_child_path = '../node_modules/expo-modules-core/ios/Core/Views/SwiftUI/AnyChild.swift'
  if File.exist?(any_child_path)
    puts "Patching AnyChild.swift..."
    content = File.read(any_child_path)
    
    # Move the protocol outside of any parent declaration
    if content.include?('protocol AnyChild')
      # Replace the nested protocol with a top-level one
      content.gsub!(/^(\s+)public protocol AnyChild/, 'public protocol AnyChild')
      
      File.write(any_child_path, content)
      puts "✅ Patched AnyChild.swift"
    end
  end
  
  # Fix 2: Replace onGeometryChange with iOS 15 compatible code
  auto_sizing_path = '../node_modules/expo-modules-core/ios/Core/Views/SwiftUI/AutoSizingStack.swift'
  if File.exist?(auto_sizing_path)
    puts "Patching AutoSizingStack.swift..."
    content = File.read(auto_sizing_path)
    
    # Replace the iOS 18 API with iOS 15 compatible code
    if content.include?('.onGeometryChange')
      content.gsub!(
        /\.onGeometryChange\(for: CGSize\.self, of: \{ proxy in proxy\.size \}, action: \{ size in/,
        '.background(GeometryReader { proxy in Color.clear.preference(key: SizePreferenceKey.self, value: proxy.size) }).onPreferenceChange(SizePreferenceKey.self) { size in'
      )
      
      # Add the preference key if not already present
      unless content.include?('struct SizePreferenceKey')
        # Add at the end of the file before the last closing brace
        preference_key = "\nstruct SizePreferenceKey: PreferenceKey {\n  static var defaultValue: CGSize = .zero\n  static func reduce(value: inout CGSize, nextValue: () -> CGSize) {\n    value = nextValue()\n  }\n}\n"
        
        # Find the last closing brace and insert before it
        last_brace_index = content.rindex('}')
        if last_brace_index
          content.insert(last_brace_index, preference_key)
        end
      end
      
      File.write(auto_sizing_path, content)
      puts "✅ Patched AutoSizingStack.swift"
    end
  end
  
  # Fix 3: Fix CoreModule.swift closure return type
  core_module_path = '../node_modules/expo-modules-core/ios/Core/Modules/CoreModule.swift'
  if File.exist?(core_module_path)
    puts "Patching CoreModule.swift..."
    content = File.read(core_module_path)
    
    # Add explicit return type to the closure
    if content.include?('Constant("expoModulesCoreVersion") {')
      content.gsub!(
        /Constant\("expoModulesCoreVersion"\) \{/,
        'Constant("expoModulesCoreVersion") { () -> String in'
      )
      
      File.write(core_module_path, content)
      puts "✅ Patched CoreModule.swift"
    end
  end
  
  # Fix 4: SwiftUIHostingView.swift - Move nested protocol
  hosting_view_path = '../node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift'
  if File.exist?(hosting_view_path)
    puts "Patching SwiftUIHostingView.swift..."
    content = File.read(hosting_view_path)
    
    # Find and extract the nested protocol
    if content =~ /^(\s+)public protocol WithHostingView \{([^}]*)\}/m
      indent = $1
      protocol_body = $2
      
      # Remove the nested protocol
      content.gsub!(/^#{Regexp.escape(indent)}public protocol WithHostingView \{[^}]*\}\n/m, '')
      
      # Add it at the top level after imports
      import_section = content.match(/(import [^\n]+\n)+/m)
      if import_section
        insert_pos = import_section.end(0)
        protocol_def = "\npublic protocol WithHostingView {\n#{protocol_body}\n}\n\n"
        content.insert(insert_pos, protocol_def)
      end
      
      File.write(hosting_view_path, content)
      puts "✅ Patched SwiftUIHostingView.swift"
    end
  end
  
  # Fix 5: PersistentFileLog.swift - Remove unnecessary 'try'
  log_path = '../node_modules/expo-modules-core/ios/Core/Logging/PersistentFileLog.swift'
  if File.exist?(log_path)
    puts "Patching PersistentFileLog.swift..."
    content = File.read(log_path)
    
    if content.include?('try fileHandle.write(data)')
      content.gsub!('try fileHandle.write(data)', 'fileHandle.write(data)')
      File.write(log_path, content)
      puts "✅ Patched PersistentFileLog.swift"
    end
  end
  
  puts "ExpoModulesCore patches completed!"
end

# Run the patch
patch_expo_modules_core