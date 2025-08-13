#!/usr/bin/env ruby

require 'xcodeproj'

# Open the Pods project
project_path = 'Pods/Pods.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Disable signing for ALL targets in the Pods project
project.targets.each do |target|
  target.build_configurations.each do |config|
    # Completely disable code signing
    config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
    config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
    config.build_settings['CODE_SIGNING_ALLOWED[sdk=iphoneos*]'] = 'NO'
    config.build_settings['CODE_SIGNING_REQUIRED[sdk=iphoneos*]'] = 'NO'
    
    # Clear all signing identities and profiles
    config.build_settings['CODE_SIGNING_IDENTITY'] = ''
    config.build_settings['CODE_SIGNING_IDENTITY[sdk=iphoneos*]'] = ''
    config.build_settings['EXPANDED_CODE_SIGN_IDENTITY'] = ''
    config.build_settings['EXPANDED_CODE_SIGN_IDENTITY[sdk=iphoneos*]'] = ''
    config.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = ''
    config.build_settings['PROVISIONING_PROFILE'] = ''
    config.build_settings['DEVELOPMENT_TEAM'] = ''
    
    # Force manual signing (which won't be used since signing is disabled)
    config.build_settings['CODE_SIGN_STYLE'] = 'Manual'
    
    # Also disable entitlements for Pods
    config.build_settings['CODE_SIGN_ENTITLEMENTS'] = ''
    
    puts "Disabled signing for target: #{target.name} - #{config.name}"
  end
end

# Save the project
project.save

puts "Successfully disabled code signing for all Pods targets"