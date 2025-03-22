import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../context/AppContext';
import NavBar from '../context/NavBar';
import { useNavigation } from "@react-navigation/native";
import SearchBar from '../context/SearchBar';
import HomeCard from './HomeCard';

const Groceries: React.FC = () => {
  const { addToCart, searchValue } = useAppContext();
  const [productList, setProductList] = useState<any[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartBadgeVisibility, setCartBadgeVisibility] = useState<Record<string, boolean>>({});
  
  const router = useRouter();

  // ✅ Fetch Data with Debugging
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("📡 Fetching groceries from API...");
        
        const response = await axios.get('https://backendforworld.onrender.com/api/groceries');
        
        console.log("✅ API Response:", response.data);

        if (!Array.isArray(response.data)) {
          console.error("❌ API returned an invalid response:", response.data);
          return;
        }

        const formattedData = response.data.map((p: any) => ({
          ...p,
          category: 'grocery',
        }));

        await AsyncStorage.setItem('groceriesData', JSON.stringify(formattedData));
        setProductList(formattedData);
      } catch (error) {
        console.error("❌ Error fetching groceries:", error.response?.data || error.message);
      }
    };

    fetchData();
  }, []);

  // ✅ Store Cart Quantities in AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem('groceriesQuantities', JSON.stringify(cartQuantities));
  }, [cartQuantities]);

  // ✅ Search Filter
  const filteredData = useMemo(() => {
    return productList.filter((val) =>
      val?.name?.toLowerCase().includes((searchValue ?? "").toLowerCase())
    );
  }, [productList, searchValue]);

  // ✅ Handle Increment
  const handleIncrement = (id: string) => {
    setCartQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 1) + 1 }));
    setCartBadgeVisibility((prev) => ({ ...prev, [id]: true }));
  };

  // ✅ Handle Decrement
  const handleDecrement = (id: string) => {
    setCartQuantities((prev) => {
      const updatedQuantity = Math.max((prev[id] ?? 1) - 1, 1);
      return { ...prev, [id]: updatedQuantity };
    });
    setCartBadgeVisibility((prev) => ({ ...prev, [id]: (cartQuantities[id] ?? 1) > 1 }));
  };

  // ✅ Handle Add to Cart
  const handleAddToCart = (item: any) => {
    const quantityToAdd = cartQuantities[item._id] ?? 1;
    if (quantityToAdd > 0) {
      addToCart({
        ...item,
        img: `https://backendforworld.onrender.com/${item?.img?.replace(/^\/+/, '')}`,
        quantity: quantityToAdd,
      });
      setCartBadgeVisibility((prev) => ({ ...prev, [item._id]: false }));
      Alert.alert("✅ Added to Cart", `${item.name} added successfully!`);
    }
  };

  // ✅ Calculate Discount
  const calculateDiscount = (originalPrice: number, discountedPrice: number) => {
    if (originalPrice <= 0 || discountedPrice <= 0 || discountedPrice < originalPrice) return 0;
    return Math.abs(Math.round(((originalPrice - discountedPrice) / originalPrice) * 100));
  };

  return (
    <View style={styles.container}>
      <NavBar />
      <SearchBar />
      <HomeCard />

      {/* ✅ Product List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.setItem("selectedGrocery", JSON.stringify(item));
                router.push("/comp/GroceryDetails");
              }}
            >
              <Image
                source={{ uri: `https://backendforworld.onrender.com/${item.img?.replace(/^\/+/, "")}` }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) => console.error("❌ Image Load Error:", e.nativeEvent.error)}
              />
            </TouchableOpacity>
            <View>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>  
            </View>
           <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{item.price}</Text>
              <Text style={styles.discount}>₹{item.Dprice}</Text>
            </View>
            <Text style={styles.discountBadge}>
              {calculateDiscount(item.price, item.Dprice)}% OFF
            </Text>
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => handleDecrement(item._id)} style={styles.button}>
                <Minus size={18} color="white" />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={String(cartQuantities[item._id] ?? 1)}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setCartQuantities((prev) => ({ ...prev, [item._id]: parseInt(text) || 1 }))
                }
              />
              <TouchableOpacity onPress={() => handleIncrement(item._id)} style={styles.button}>
                <Plus size={18} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleAddToCart(item)} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
              <ShoppingBag size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
    width: "49%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { width: 190, height: 151, borderRadius: 8 },
  name: { fontSize: 14, fontWeight: "bold", marginTop: 8, textAlign: "center", width: "90%" },
  priceContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  discountBadge: { fontSize: 12, color: "red", fontWeight: "bold", marginLeft: 6 },
  price: { fontSize: 20, fontWeight: "bold", color: "green", marginRight: 6 },
  discount: { fontSize: 12, color: "gray", textDecorationLine: "line-through" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  button: {
    backgroundColor: "#023e8a",
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#023e8a",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    margin: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 4,
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    borderBottomWidth: 0,
    borderColor: "#ccc",
    marginHorizontal: 1,
  },
});

export default Groceries;



