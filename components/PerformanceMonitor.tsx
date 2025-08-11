import React, { useState, useEffect, memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';

interface PerformanceStats {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
}

const PerformanceMonitor = memo(() => {
  const [stats, setStats] = useState<PerformanceStats>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [startTime] = useState(Date.now());
  const renderCountRef = useRef(0);
  const totalRenderTimeRef = useRef(0);

  // Track renders without causing infinite loops
  useEffect(() => {
    const renderStart = performance.now();
    renderCountRef.current += 1;

    // Update stats periodically instead of on every render
    const updateStats = () => {
      const renderTime = performance.now() - renderStart;
      totalRenderTimeRef.current += renderTime;

      setStats({
        renderCount: renderCountRef.current,
        lastRenderTime: renderTime,
        averageRenderTime: totalRenderTimeRef.current / renderCountRef.current,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      });
    };

    // Update stats every 1 second instead of on every render
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  const resetStats = () => {
    renderCountRef.current = 0;
    totalRenderTimeRef.current = 0;
    setStats({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
    });
  };

  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.toggleText}>📊</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Monitor</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Renders:</Text>
          <Text style={styles.statValue}>{stats.renderCount}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Last Render:</Text>
          <Text style={styles.statValue}>
            {stats.lastRenderTime.toFixed(2)}ms
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Avg Render:</Text>
          <Text style={styles.statValue}>
            {stats.averageRenderTime.toFixed(2)}ms
          </Text>
        </View>
        
        {stats.memoryUsage && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Memory:</Text>
            <Text style={styles.statValue}>
              {(stats.memoryUsage / 1024 / 1024).toFixed(1)}MB
            </Text>
          </View>
        )}
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Uptime:</Text>
          <Text style={styles.statValue}>
            {Math.floor((Date.now() - startTime) / 1000)}s
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.resetButton} onPress={resetStats}>
        <Text style={styles.resetButtonText}>Reset Stats</Text>
      </TouchableOpacity>
    </View>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  toggleText: {
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  closeButton: {
    fontSize: 16,
    color: COLORS.text.gray,
    padding: 4,
  },
  statsContainer: {
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.gray,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
  },
  resetButtonText: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PerformanceMonitor;
