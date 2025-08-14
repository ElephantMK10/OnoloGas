import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

// Directly export Ionicons with proper TypeScript types
type CustomIconProps = ComponentProps<typeof Ionicons>;

// Export as a named component for better type safety
export const CustomIcon = Ionicons;

// Default export for backward compatibility
export default CustomIcon;
