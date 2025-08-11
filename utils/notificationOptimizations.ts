import type { NotificationSettings, NotificationPreferences } from '../services/interfaces/INotificationService';

/**
 * Utility to batch notification updates and prevent excessive API calls
 */
export class NotificationUpdateBatcher {
  private pendingUpdates: Map<string, {
    settings?: NotificationSettings;
    preferences?: NotificationPreferences;
    timestamp: number;
  }> = new Map();

  private readonly BATCH_DELAY = 1000; // 1 second
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Queue an update for batching
   */
  queueUpdate(
    userId: string,
    settings?: NotificationSettings,
    preferences?: NotificationPreferences,
    callback?: (settings: NotificationSettings, preferences: NotificationPreferences) => Promise<void>
  ) {
    // Clear existing timeout for this user
    const existingTimeout = this.timeouts.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Update pending changes
    const existing = this.pendingUpdates.get(userId) || { timestamp: Date.now() };
    this.pendingUpdates.set(userId, {
      settings: settings || existing.settings,
      preferences: preferences || existing.preferences,
      timestamp: Date.now(),
    });

    // Set new timeout
    const timeout = setTimeout(async () => {
      const pending = this.pendingUpdates.get(userId);
      if (pending && callback && pending.settings && pending.preferences) {
        try {
          await callback(pending.settings, pending.preferences);
          this.pendingUpdates.delete(userId);
          this.timeouts.delete(userId);
        } catch (error) {
          console.error('NotificationUpdateBatcher: Error in batched update:', error);
        }
      }
    }, this.BATCH_DELAY);

    this.timeouts.set(userId, timeout);
  }

  /**
   * Force flush all pending updates
   */
  async flushAll(
    callback: (userId: string, settings: NotificationSettings, preferences: NotificationPreferences) => Promise<void>
  ) {
    const promises: Promise<void>[] = [];

    for (const [userId, pending] of this.pendingUpdates.entries()) {
      if (pending.settings && pending.preferences) {
        promises.push(callback(userId, pending.settings, pending.preferences));
      }
    }

    // Clear all timeouts and pending updates
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.pendingUpdates.clear();

    await Promise.all(promises);
  }

  /**
   * Clear all pending updates for a user
   */
  clearUser(userId: string) {
    const timeout = this.timeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(userId);
    }
    this.pendingUpdates.delete(userId);
  }

  /**
   * Get pending update count
   */
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

/**
 * Utility to compare notification objects and detect changes
 */
export const notificationUtils = {
  /**
   * Check if settings have changed
   */
  settingsChanged(
    current: NotificationSettings,
    previous: NotificationSettings
  ): boolean {
    return (
      current.email !== previous.email ||
      current.sms !== previous.sms ||
      current.push !== previous.push
    );
  },

  /**
   * Check if preferences have changed
   */
  preferencesChanged(
    current: NotificationPreferences,
    previous: NotificationPreferences
  ): boolean {
    return (
      current.orderUpdates !== previous.orderUpdates ||
      current.promotions !== previous.promotions ||
      current.newsletter !== previous.newsletter
    );
  },

  /**
   * Validate settings object
   */
  validateSettings(settings: any): settings is NotificationSettings {
    return (
      settings &&
      typeof settings === 'object' &&
      typeof settings.email === 'boolean' &&
      typeof settings.sms === 'boolean' &&
      typeof settings.push === 'boolean'
    );
  },

  /**
   * Validate preferences object
   */
  validatePreferences(preferences: any): preferences is NotificationPreferences {
    return (
      preferences &&
      typeof preferences === 'object' &&
      typeof preferences.orderUpdates === 'boolean' &&
      typeof preferences.promotions === 'boolean' &&
      typeof preferences.newsletter === 'boolean'
    );
  },

  /**
   * Create default settings
   */
  getDefaultSettings(): NotificationSettings {
    return {
      email: true,
      sms: true,
      push: true,
    };
  },

  /**
   * Create default preferences
   */
  getDefaultPreferences(): NotificationPreferences {
    return {
      orderUpdates: true,
      promotions: true,
      newsletter: true,
    };
  },
};

// Global batcher instance
export const notificationBatcher = new NotificationUpdateBatcher();
