import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { PRODUCTS } from '../../constants/products';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { preloadImages } from '../../utils/imagePreloader';

export default function OrderScreen() {
  const { addToCart } = useCart();

  // Filter products to show only gas products
  const gasProducts = PRODUCTS.filter((product) => product.type === 'gas');

  // Preload all product images when screen loads
  useEffect(() => {
    const imageSources = [
      require('../../assets/images/Gas-Cylinder-9kg.jpg'),
      require('../../assets/images/Gas-Cylinder-19kg.jpg'),
      require('../../assets/images/Gas-Cylinder-48kg.jpg'),
    ];

    preloadImages(imageSources).catch(error => {
      console.warn('Failed to preload product images:', error);
    });
  }, []);

  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Select Your Gas Refill</Text>
        <FlatList
          data={gasProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} onAddToCart={handleAddToCart} />}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 200, // Estimated height of ProductCard
            offset: 200 * index,
            index,
          })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  productsList: {
    paddingBottom: 20,
  },
});
