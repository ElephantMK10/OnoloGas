import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useMessages } from '../contexts/MessagesContext';

const TestDataGenerator = memo(() => {
  const { sendMessage } = useMessages();

  const generateTestMessages = async (count: number) => {
    const testMessages = [
      "Testing FlatList performance optimization! 🚀",
      "This message tests smooth scrolling",
      "Performance improvements are working great!",
      "LazyImage component loading test",
      "Bundle size optimization complete ✅",
      "Memory usage has been reduced significantly",
      "Chat scrolling should be buttery smooth now",
      "Product list rendering is much faster",
      "Context memoization prevents unnecessary re-renders",
      "Component optimization reduces CPU usage",
      "Database queries are now paginated efficiently",
      "Network usage has been optimized",
      "React.memo prevents component re-renders",
      "useCallback optimizes function references",
      "useMemo prevents expensive recalculations",
      "FlatList getItemLayout enables jump-to-item",
      "removeClippedSubviews improves memory usage",
      "maxToRenderPerBatch controls rendering batches",
      "windowSize optimizes viewport management",
      "initialNumToRender sets initial render count"
    ];

    for (let i = 0; i < count; i++) {
      const message = testMessages[i % testMessages.length];
      const timestamp = new Date(Date.now() - (count - i) * 1000);
      
      await sendMessage(`${i + 1}. ${message}`, timestamp);
      
      // Small delay to prevent overwhelming the system
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Test Tools</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => generateTestMessages(10)}
        >
          <Text style={styles.buttonText}>Add 10 Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => generateTestMessages(25)}
        >
          <Text style={styles.buttonText}>Add 25 Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => generateTestMessages(50)}
        >
          <Text style={styles.buttonText}>Add 50 Messages</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instructions}>
        Use these buttons to generate test messages for testing chat performance.
        After adding messages, scroll up and down rapidly to test FlatList optimizations.
      </Text>
    </View>
  );
});

TestDataGenerator.displayName = 'TestDataGenerator';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  buttonText: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 12,
    color: COLORS.text.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default TestDataGenerator;
