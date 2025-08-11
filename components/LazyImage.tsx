import React, { useState, memo, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageProps } from 'react-native';
import { COLORS } from '../constants/colors';

// Simple in-memory cache for loaded images
const imageCache = new Map<string, boolean>();

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  source: any;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
}

const LazyImage = memo<LazyImageProps>(({
  source,
  placeholder,
  fallback,
  width = 100,
  height = 100,
  style,
  ...props
}) => {
  // Generate cache key from source
  const cacheKey = typeof source === 'object' && source.uri ? source.uri : JSON.stringify(source);
  const isCached = imageCache.has(cacheKey);

  const [loading, setLoading] = useState(!isCached);
  const [error, setError] = useState(false);

  // Preload image if not cached
  useEffect(() => {
    if (!isCached && typeof source === 'object' && source.uri) {
      // Preload network images
      Image.prefetch(source.uri).catch(() => {
        // Ignore prefetch errors, let the main Image component handle them
      });
    }
  }, [source, isCached, cacheKey]);

  const handleLoadStart = () => {
    if (!isCached) {
      setLoading(true);
    }
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    // Mark as cached for future renders
    imageCache.set(cacheKey, true);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Image
        source={source}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        style={[styles.image, { width, height }]}
        {...props}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          {placeholder || (
            <ActivityIndicator 
              size="small" 
              color={COLORS.primary} 
            />
          )}
        </View>
      )}
    </View>
  );
});

LazyImage.displayName = 'LazyImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
});

export default LazyImage;
