import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../app/context/AppContext";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const { width } = Dimensions.get('window');

const ProductDetails: React.FC = () => {
  const { addToCart } = useAppContext();
  const navigation = useNavigation();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const storedProduct = await AsyncStorage.getItem("selectedProduct");
        if (storedProduct) {
          const parsedProduct = JSON.parse(storedProduct);
          setProduct({
            ...parsedProduct,
            // Mock multiple images for demo
            images: parsedProduct.img 
              ? [
                  parsedProduct.img,
                   ]
              : []
          });
        } else {
          Alert.alert("Error", "No product data found!");
        }
      } catch (error) {
        console.error("Error fetching product from storage:", error);
      }
    };

    fetchProduct();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading product details...</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });

    Toast.show({
      type: "success",
      text1: "Added to Cart",
      text2: `${quantity} ${product.name}(s) added to your cart`,
      visibilityTime: 2000,
      position: "bottom",
    });
  };

  const handleBuyNow = () => {
    addToCart({ ...product, quantity });
    navigation.navigate("Cart");
  };

  const handleQuantityChange = (val: string) => {
    const num = Math.max(1, Math.min(99, Number(val) || 1));
    setQuantity(num);
  };

  const incrementQuantity = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          {/* <Text style={styles.headerTitle}>Product Details</Text> */}
          {/* <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => router.push("/context/CartSidebar")}
          >
            <FontAwesome name="shopping-cart" size={20} color="#000" />
          </TouchableOpacity> */}
        </View>

        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((img: string, index: number) => (
              <Image
                key={index}
                source={{
                  uri: img.startsWith("http")
                    ? img
                    : `http://localhost:5001/${img.replace(/^\/+/, "")}`,
                }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
          <View style={styles.imagePagination}>
            {product.images.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.paginationDot,
                  index === selectedImageIndex && styles.activeDot
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Brand */}
          {product.brand && (
            <Text style={styles.brandText}>Brand: {product.brand}</Text>
          )}
          
          {/* Category */}
          {/* {product.category && (
            <Text style={styles.categoryText}>Category: {product.category}</Text>
          )} */}
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons 
                  key={i} 
                  name="star" 
                  size={16} 
                  color={i <= 4 ? "#FFD700" : "#C0C0C0"} 
                />
              ))}
            </View>
            <Text style={styles.ratingText}>4.3 (2,456 ratings)</Text>
          </View>
          
          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
            {product.Dprice && (
              <>
                <Text style={styles.originalPrice}>₹{product.Dprice.toLocaleString()}</Text>
                <Text style={styles.discount}>
                  {Math.round((1 - product.price/product.Dprice) * 100)}% off
                </Text>
              </>
            )}
          </View>
          
          {product.Dprice && (
            <Text style={styles.savingText}>
              You save: ₹{(product.Dprice - product.price).toLocaleString()} ({Math.round((1 - product.price/product.Dprice) * 100)}%)
            </Text>
          )}
          
          {/* Weight/Size */}
          {product.weight && (
            <View style={styles.weightContainer}>
              <Text style={styles.sectionTitle}>Size/Weight:</Text>
              <Text style={styles.weightText}>{product.weight}</Text>
            </View>
          )}
          
          {/* Offers */}
          <View style={styles.offersContainer}>
            <Text style={styles.sectionTitle}>Available offers</Text>
            <View style={styles.offerItem}>
              <MaterialIcons name="local-offer" size={18} color="#388E3C" />
              <Text style={styles.offerText}>Special Price Get extra 15% off (price inclusive of discount)</Text>
            </View>
            {/* <View style={styles.offerItem}>
              <MaterialIcons name="local-offer" size={18} color="#388E3C" />
              <Text style={styles.offerText}>Bank Offer 7% Cashback on ICICI Bank Card</Text>
            </View> */}
          </View>
          
          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.sectionTitle}>Quantity:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                onPress={decrementQuantity}
                style={styles.quantityButton}
                disabled={quantity <= 1}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                value={String(quantity)}
                keyboardType="numeric"
                onChangeText={handleQuantityChange}
                style={styles.quantityInput}
              />
              <TouchableOpacity 
                onPress={incrementQuantity}
                style={styles.quantityButton}
                disabled={quantity >= 99}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {product.description || "High-quality product with premium features. Designed for durability and performance."}
            </Text>
          </View>
          
          {/* Specifications */}
          {product.specifications && (
            <View style={styles.specsContainer}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}:</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Action Bar */}
      {!keyboardVisible && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addToCartButton]}
            onPress={handleAddToCart}
          >
            <Text style={styles.actionButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity 
            style={[styles.actionButton, styles.buyNowButton]}
            onPress={handleBuyNow}
          >
            <LinearGradient
              colors={['#FFA41C', '#FF8F00']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Buy Now</Text>
            </LinearGradient>
          </TouchableOpacity> */}
        </View>
      )}

      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingBottom: 80, // Space for action bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartButton: {
    padding: 5,
  },
  imageGallery: {
    height: width * 0.9,
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: width,
    height: width * 0.9,
  },
  imagePagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFA41C',
    width: 16,
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  brandText: {
    fontSize: 16,
    color: '#565959',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 16,
    color: '#565959',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    color: '#007185',
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B12704',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#565959',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discount: {
    fontSize: 16,
    color: '#388E3C',
    fontWeight: 'bold',
  },
  savingText: {
    color: '#388E3C',
    fontSize: 14,
    marginBottom: 15,
  },
  weightContainer: {
    marginBottom: 15,
  },
  weightText: {
    fontSize: 16,
    color: '#0F1111',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  offersContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
  },
  offerItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  offerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F1111',
  },
  quantityContainer: {
    marginVertical: 15,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f0f0f0',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 16,
  },
  descriptionContainer: {
    marginVertical: 15,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0F1111',
  },
  specsContainer: {
    marginVertical: 15,
  },
  specRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  specKey: {
    fontWeight: 'bold',
    width: 120,
    color: '#565959',
  },
  specValue: {
    flex: 1,
    color: '#0F1111',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  addToCartButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFD814',
  },
  buyNowButton: {
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 50,
  },
});

export default ProductDetails;