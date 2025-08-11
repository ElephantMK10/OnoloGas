import { Image } from 'react-native';

/**
 * Utility for preloading images to improve performance
 */
class ImagePreloader {
  private static instance: ImagePreloader;
  private preloadedImages = new Set<string>();
  private preloadPromises = new Map<string, Promise<void>>();

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  /**
   * Preload a single image
   */
  async preloadImage(source: any): Promise<void> {
    const key = this.getImageKey(source);
    
    if (this.preloadedImages.has(key)) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has(key)) {
      return this.preloadPromises.get(key)!;
    }

    const promise = this.doPreload(source, key);
    this.preloadPromises.set(key, promise);
    
    return promise;
  }

  /**
   * Preload multiple images
   */
  async preloadImages(sources: any[]): Promise<void[]> {
    return Promise.all(sources.map(source => this.preloadImage(source)));
  }

  /**
   * Check if image is preloaded
   */
  isPreloaded(source: any): boolean {
    const key = this.getImageKey(source);
    return this.preloadedImages.has(key);
  }

  /**
   * Clear preload cache
   */
  clearCache(): void {
    this.preloadedImages.clear();
    this.preloadPromises.clear();
  }

  private async doPreload(source: any, key: string): Promise<void> {
    try {
      if (typeof source === 'object' && source.uri) {
        // Network image
        await Image.prefetch(source.uri);
      } else {
        // Local asset - resolve to ensure it's loaded
        Image.resolveAssetSource(source);
      }
      
      this.preloadedImages.add(key);
      this.preloadPromises.delete(key);
    } catch (error) {
      console.warn('Failed to preload image:', error);
      this.preloadPromises.delete(key);
      throw error;
    }
  }

  private getImageKey(source: any): string {
    if (typeof source === 'object' && source.uri) {
      return source.uri;
    }
    return JSON.stringify(source);
  }
}

// Export singleton instance
export const imagePreloader = ImagePreloader.getInstance();

// Convenience functions
export const preloadImage = (source: any) => imagePreloader.preloadImage(source);
export const preloadImages = (sources: any[]) => imagePreloader.preloadImages(sources);
export const isImagePreloaded = (source: any) => imagePreloader.isPreloaded(source);
