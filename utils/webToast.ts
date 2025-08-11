import { Platform } from 'react-native';

/**
 * Web-compatible toast utility
 * Provides fallback notifications for web platforms where react-native-toast-message might not work
 */

interface ToastConfig {
  type: 'success' | 'error' | 'info';
  text1: string;
  text2?: string;
  position?: 'top' | 'bottom';
  visibilityTime?: number;
}

export const showWebToast = (config: ToastConfig) => {
  if (Platform.OS === 'web') {
    // Create a web-native notification
    createWebNotification(config);
  } else {
    // Use react-native-toast-message for mobile
    const Toast = require('react-native-toast-message').default;
    Toast.show(config);
  }
};

const createWebNotification = (config: ToastConfig) => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'web-toast';
  
  // Set styles
  const isTop = config.position === 'top';
  toast.style.cssText = `
    position: fixed;
    ${isTop ? 'top: 20px;' : 'bottom: 20px;'}
    right: 20px;
    background: ${getBackgroundColor(config.type)};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    border-left: 4px solid ${getBorderColor(config.type)};
  `;

  // Set content
  const icon = getIcon(config.type);
  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="font-size: 18px; margin-top: 1px;">${icon}</div>
      <div>
        <div style="font-weight: 600; margin-bottom: ${config.text2 ? '4px' : '0'};">
          ${config.text1}
        </div>
        ${config.text2 ? `<div style="opacity: 0.9; font-size: 13px;">${config.text2}</div>` : ''}
      </div>
    </div>
  `;

  // Add to DOM
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove
  const duration = config.visibilityTime || 3000;
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);

  // Click to dismiss
  toast.addEventListener('click', () => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  });
};

const getBackgroundColor = (type: string): string => {
  switch (type) {
    case 'success':
      return '#10B981'; // Green
    case 'error':
      return '#EF4444'; // Red
    case 'info':
      return '#3B82F6'; // Blue
    default:
      return '#6B7280'; // Gray
  }
};

const getBorderColor = (type: string): string => {
  switch (type) {
    case 'success':
      return '#059669';
    case 'error':
      return '#DC2626';
    case 'info':
      return '#2563EB';
    default:
      return '#4B5563';
  }
};

const getIcon = (type: string): string => {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'info':
      return 'ℹ️';
    default:
      return '📢';
  }
};

// Utility function to show common toast types
export const webToast = {
  success: (text1: string, text2?: string) => 
    showWebToast({ type: 'success', text1, text2, position: 'top' }),
  
  error: (text1: string, text2?: string) => 
    showWebToast({ type: 'error', text1, text2, position: 'top' }),
  
  info: (text1: string, text2?: string) => 
    showWebToast({ type: 'info', text1, text2, position: 'top' }),
};
