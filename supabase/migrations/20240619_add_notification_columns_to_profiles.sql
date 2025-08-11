-- Add notification columns to profiles table
alter table profiles
add column if not exists notification_settings jsonb,
add column if not exists notification_preferences jsonb,
add column if not exists expo_push_token text; 