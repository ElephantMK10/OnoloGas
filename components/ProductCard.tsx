import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CustomIcon from './CustomIcon';
import { COLORS } from '../constants/colors';
import { Product } from '../constants/products';
import Button from './Button';
import LazyImage from './LazyImage';
import Toast from 'react-native-toast-message';
import { preloadImages } from '../utils/imagePreloader';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductCard = memo<ProductCardProps>(({ product, onAddToCart }) => {
  // Memoize image sources to prevent recreation on every render
  const imageSources = useMemo(() => ({
    'gas-cylinder-9kg': require('../assets/images/Gas-Cylinder-9kg.jpg'),
    'gas-cylinder-19kg': require('../assets/images/Gas-Cylinder-19kg.jpg'),
    'gas-cylinder-48kg': require('../assets/images/Gas-Cylinder-48kg.jpg'),
  }), []);

  const productImage = imageSources[product.image as keyof typeof imageSources];
  const [quantity, setQuantity] = useState(1);

  // Preload all product images on component mount for better performance
  useEffect(() => {
    // Preload all product images in the background
    const imageSourcesArray = Object.values(imageSources).filter(Boolean);
    if (imageSourcesArray.length > 0) {
      preloadImages(imageSourcesArray).catch(error => {
        console.warn('Failed to preload some product images:', error);
      });
    }
  }, [imageSources]);

  const increaseQuantity = useCallback(() => {
    setQuantity((prev) => prev + 1);
  }, []);

  const decreaseQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  }, [quantity]);

  const handleAddToCart = useCallback(() => {
    onAddToCart(product, quantity);

    // Show toast notification
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${quantity} x ${product.name} added to your cart.`,
      position: 'bottom',
      visibilityTime: 2000,
    });

    // Reset quantity after adding to cart
    setQuantity(1);
  }, [onAddToCart, product, quantity]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {productImage ? (
          <LazyImage
            source={productImage}
            width={72}
            height={72}
            style={{ resizeMode: 'contain' }}
          />
        ) : (
          <CustomIcon
            name={product.type === 'gas' ? 'flame-outline' : 'water-outline'}
            size={60}
            color={COLORS.primary}
          />
        )}
      </View>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.price}>R {product.price.toFixed(2)}</Text>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={decreaseQuantity}
          disabled={quantity <= 1}
        >
          <CustomIcon
            name="remove"
            size={20}
            color={quantity <= 1 ? COLORS.inactive : COLORS.text.white}
          />
        </TouchableOpacity>

        <Text style={styles.quantityText}>{quantity}</Text>

        <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
          <CustomIcon name="add" size={20} color={COLORS.text.white} />
        </TouchableOpacity>
      </View>

      <Button title="Add to Cart" onPress={handleAddToCart} style={styles.button} />
    </View>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    textAlign: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  name: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  price: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    textAlign: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  button: {
    marginTop: 8,
  },
});
