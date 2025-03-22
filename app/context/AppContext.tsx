import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Alert } from "react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

// ✅ Define Types
interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  img?: string;
}

interface User {
  _id: string;
  name: string;
  phone: string;
  address: string;
}

interface AppContextProps {
  user: User | null;
  vendorId: string | null;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  handleOrderNow: () => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

// ✅ Create Context
const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const API_URL = "https://backendforworld.onrender.com/api";
  const isDataLoaded = useRef(false);
  const [searchValue, setSearchValue] = useState("");

  // ✅ Load User Data from AsyncStorage & Backend
  useEffect(() => {
    if (isDataLoaded.current) return;
    isDataLoaded.current = true;

    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.error("❌ No auth token found!");
          return;
        }

        const storedUserId = await AsyncStorage.getItem("userId");
        if (!storedUserId) {
          console.warn("⚠️ No userId found in AsyncStorage!");
          return;
        }

        console.log("🟢 Found userId:", storedUserId);

        const userResponse = await axios.get(`${API_URL}/auth/user/${storedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedUser = userResponse.data;
        setUser(fetchedUser);

        await AsyncStorage.setItem("userData", JSON.stringify(fetchedUser));
        await AsyncStorage.setItem("userId", fetchedUser._id);

        console.log("🟢 User Data Loaded:", fetchedUser);
      } catch (error) {
        console.error("❌ Error fetching data:", error?.response?.data || error);
      }
    };

    fetchData();
  }, []);

  // ✅ Store cart in AsyncStorage instantly
  const saveCartToStorage = async (updatedCart: CartItem[]) => {
    try {
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (error) {
      console.error("❌ Error saving cart:", error);
    }
  };

  // ✅ Add Item to Cart
  const addToCart = useCallback((item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id);
      const updatedCart = existingItem
        ? prevCart.map((cartItem) =>
            cartItem._id === item._id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          )
        : [...prevCart, item];

      saveCartToStorage(updatedCart);
      return updatedCart;
    });

    // ✅ Show toast notification
    Toast.show({
      type: "success",
      text1: "✅ Success",
      text2: `${item.name} added to cart!`,
      visibilityTime: 2000,
      position: "bottom",
    });
  }, []);

  // ✅ Remove Item from Cart
  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item._id !== itemId);
      saveCartToStorage(updatedCart);
      return updatedCart;
    });

    Alert.alert("✅ Success", "Item removed from cart!");
  }, []);

  // ✅ Update Cart Quantity
  const updateCartQuantity = useCallback((id: string, newQuantity: number) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item._id === id ? { ...item, quantity: newQuantity } : item
      );
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  }, []);

  // ✅ Place Order
  const handleOrderNow = async () => {
    try {
      console.log("📡 Connecting to API:", API_URL);
  
      // ✅ Fetch user data from AsyncStorage
      let storedUserData = await AsyncStorage.getItem("userData");
      let user = storedUserData ? JSON.parse(storedUserData) : null;
  
      let storedUserId = await AsyncStorage.getItem("userId");
      let userId = storedUserId || user?._id;
  
      if (!userId) {
        console.error("❌ userId is missing! Trying to fetch again...");
        storedUserId = await AsyncStorage.getItem("userId"); // Retry fetching
        userId = storedUserId || user?._id;
  
        if (!userId) {
          return Alert.alert("⚠️ Missing User Info", "User ID is missing!");
        }
  
        await AsyncStorage.setItem("userId", userId); // Store it back if missing
      }
  
      if (!user || !user.phone || !user.address) {
        return Alert.alert("⚠️ Missing User Info", "User phone or address is missing.");
      }
  
      // ✅ Fetch cart items
      const storedCart = await AsyncStorage.getItem("cart");
      const cartItems = storedCart ? JSON.parse(storedCart) : [];
  
      if (!cartItems.length) {
        return Alert.alert("❌ Error", "Cart is empty.");
      }
  
      // ✅ Fetch user location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("⚠️ Location Permission", "Please enable location services.");
        return;
      }
  
      const location = await Location.getCurrentPositionAsync({});
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
  
      console.log("🗺️ User Location:", userLocation); // Log user location
  
      // ✅ Store the user's location in AsyncStorage for future use
      await AsyncStorage.setItem("userLocation", JSON.stringify(userLocation));
  
      const grandTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
      // const storedVendorId = await AsyncStorage.getItem("vendorId");
      const vendorId =   "67dbc243153a18be6ef0c5f0"; // Default vendor ID
  
      console.log("🛒 Final Order Data:", {
        userId,
        userName: user.name,
        vendorId,
        name: user.name,
        phone: user.phone,
        address: user.address,
        userLocation, // ✅ Added location
        cartItems,
        grandTotal,
        status: "Pending",
      });
  
      // ✅ Send order request with location
      const response = await axios.post(`${API_URL}/orders/add-order`, {
        userId,
        userName: user.name,
        vendorId,
        name: user.name,
        phone: user.phone,
        address: user.address,
        userLocation, // ✅ Include location
        cartItems,
        grandTotal,
        status: "Pending",
      });
  
      if (response.status === 201) {
        Alert.alert("✅ Success", "Order placed successfully!");
        setCart([]);
        await AsyncStorage.removeItem("cart");
      } else {
        console.error("❌ Error details:", response.data);
        Alert.alert("⚠️ Error", response.data?.msg || "Unexpected error.");
      }
    } catch (error) {
      console.error("❌ Order Placement Error:", error?.response?.data || error);
      Alert.alert("⚠️ Order Error", "Could not place order! Try again later.");
    }
  };
  
  

  return (
    <AppContext.Provider
      value={{
        user,
        vendorId,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        handleOrderNow,
        searchValue,
        setSearchValue,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ✅ Custom Hook
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

export default AppProvider;
