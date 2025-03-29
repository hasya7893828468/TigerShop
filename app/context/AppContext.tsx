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
import { Alert, Appearance } from "react-native";
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

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  [key: string]: any;
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
  cartItemCount: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
  isLoading: boolean;
  isReady: boolean;
}

// ✅ Create Context
const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tempCart, setTempCart] = useState<CartItem[]>([]); // For guest users
  const [searchValue, setSearchValue] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'en',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const API_URL = "https://backendforworld.onrender.com/api";
  const isDataLoaded = useRef(false);

  // Calculate cart item count (combines both logged-in cart and temp cart)
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0) + 
                       tempCart.reduce((total, item) => total + item.quantity, 0);

  // ✅ Helper function to get storage keys
  const getCartStorageKey = (userId: string) => `cart_${userId}`;
  const getPreferencesKey = (userId: string) => `preferences_${userId}`;
  const getGuestCartKey = () => `guest_cart`;

  // ✅ Merge temp cart with user cart when user logs in
  useEffect(() => {
    if (user && tempCart.length > 0) {
      setCart(prevCart => {
        const mergedCart = [...prevCart];
        
        tempCart.forEach(tempItem => {
          const existingItem = mergedCart.find(item => item._id === tempItem._id);
          if (existingItem) {
            existingItem.quantity += tempItem.quantity;
          } else {
            mergedCart.push(tempItem);
          }
        });

        return mergedCart;
      });
      
      setTempCart([]);
      AsyncStorage.removeItem(getGuestCartKey());
    }
  }, [user, tempCart]);

  // ✅ Load User Data, Preferences, and Cart from AsyncStorage & Backend
  useEffect(() => {
    if (isDataLoaded.current) return;
    isDataLoaded.current = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // First load guest cart if exists
        const guestCart = await AsyncStorage.getItem(getGuestCartKey());
        if (guestCart) {
          setTempCart(JSON.parse(guestCart));
        }

        // Check for existing auth token
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.log("❌ No auth token found - user not logged in");
          setIsReady(true);
          setIsLoading(false);
          return;
        }

        // Load user ID from storage
        const storedUserId = await AsyncStorage.getItem("userId");
        if (!storedUserId) {
          console.warn("⚠️ No userId found in AsyncStorage!");
          setIsReady(true);
          setIsLoading(false);
          return;
        }

        console.log("🟢 Found userId:", storedUserId);

        // Try to load user data from storage first
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUser(parsedUser);
          console.log("🟢 Loaded user data from cache");
        }

        // Fetch fresh user data from backend
        const userResponse = await axios.get(`${API_URL}/auth/user/${storedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedUser = userResponse.data;
        setUser(fetchedUser);
        
        // Update storage with fresh data
        await AsyncStorage.setItem("userData", JSON.stringify(fetchedUser));
        await AsyncStorage.setItem("userId", fetchedUser._id);

        console.log("🟢 User Data Loaded:", fetchedUser);

        // ✅ Load user preferences
        const storedPrefs = await AsyncStorage.getItem(getPreferencesKey(fetchedUser._id));
        if (storedPrefs) {
          const parsedPrefs = JSON.parse(storedPrefs);
          setPreferences(parsedPrefs);
          // Apply theme preference
          if (parsedPrefs.theme === 'dark' || (parsedPrefs.theme === 'system' && Appearance.getColorScheme() === 'dark')) {
            setIsDarkMode(true);
          } else {
            setIsDarkMode(false);
          }
        }

        // ✅ Load user-specific cart
        const storedCart = await AsyncStorage.getItem(getCartStorageKey(fetchedUser._id));
        if (storedCart) {
          setCart(JSON.parse(storedCart));
          Toast.show({
            type: 'info',
            text1: 'Cart Restored',
            text2: 'Your previous cart items have been restored',
          });
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error?.response?.data || error);
        // If there's an auth error, clear the token
        if (error?.response?.status === 401) {
          await AsyncStorage.removeItem("authToken");
        }
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    fetchData();
  }, []);

  // ✅ Handle system theme changes
  useEffect(() => {
    if (preferences.theme === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setIsDarkMode(colorScheme === 'dark');
      });
      return () => subscription.remove();
    }
  }, [preferences.theme]);

  // ✅ Store cart in AsyncStorage
  const saveCartToStorage = async (updatedCart: CartItem[]) => {
    try {
      if (user) {
        await AsyncStorage.setItem(getCartStorageKey(user._id), JSON.stringify(updatedCart));
      } else {
        await AsyncStorage.setItem(getGuestCartKey(), JSON.stringify(updatedCart));
      }
    } catch (error) {
      console.error("❌ Error saving cart:", error);
    }
  };

  // ✅ Save preferences to storage
  const savePreferences = async (newPreferences: UserPreferences) => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(getPreferencesKey(user._id), JSON.stringify(newPreferences));
    } catch (error) {
      console.error("❌ Error saving preferences:", error);
    }
  };

  // ✅ Add Item to Cart (handles both logged-in and guest users)
  const addToCart = useCallback((item: CartItem) => {
    if (isLoading) {
      Toast.show({
        type: 'info',
        text1: 'Please wait',
        text2: 'App is initializing',
      });
      return;
    }

    const operation = (prevItems: CartItem[]) => {
      const existingItem = prevItems.find((cartItem) => cartItem._id === item._id);
      const updatedItems = existingItem
        ? prevItems.map((cartItem) =>
            cartItem._id === item._id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          )
        : [...prevItems, item];

      saveCartToStorage(updatedItems);
      return updatedItems;
    };

    if (user) {
      setCart(operation);
    } else {
      setTempCart(operation);
    }

    Toast.show({
      type: "success",
      text1: "✅ Added to Cart",
      text2: `${item.name} (${item.quantity}) added to cart!`,
      visibilityTime: 2000,
      position: "bottom",
    });
  }, [user, isLoading]);

  // ✅ Remove Item from Cart
  const removeFromCart = useCallback((itemId: string) => {
    if (isLoading) return;

    const operation = (prevItems: CartItem[]) => {
      const updatedItems = prevItems.filter((item) => item._id !== itemId);
      saveCartToStorage(updatedItems);
      return updatedItems;
    };

    if (user) {
      setCart(operation);
    } else {
      setTempCart(operation);
    }

    Toast.show({
      type: "success",
      text1: "Removed",
      text2: "Item removed from cart",
      visibilityTime: 1500,
    });
  }, [user, isLoading]);

  // ✅ Update Cart Quantity
  const updateCartQuantity = useCallback((id: string, newQuantity: number) => {
    if (isLoading) return;

    const operation = (prevItems: CartItem[]) => {
      const updatedItems = prevItems.map((item) =>
        item._id === id ? { ...item, quantity: newQuantity } : item
      );
      saveCartToStorage(updatedItems);
      
      const changedItem = updatedItems.find(item => item._id === id);
      if (changedItem) {
        Toast.show({
          type: 'info',
          text1: 'Quantity Updated',
          text2: `${changedItem.name} quantity set to ${newQuantity}`,
          visibilityTime: 1000,
        });
      }
      
      return updatedItems;
    };

    if (user) {
      setCart(operation);
    } else {
      setTempCart(operation);
    }
  }, [user, isLoading]);

  // ✅ Toggle theme between light/dark
  const toggleTheme = useCallback(() => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    const newPreferences = { ...preferences, theme: newTheme };
    setPreferences(newPreferences);
    setIsDarkMode(newTheme === 'dark');
    savePreferences(newPreferences);
  }, [preferences]);

  // ✅ Update user preferences
  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    const updatedPrefs = { ...preferences, ...newPreferences };
    setPreferences(updatedPrefs);
    savePreferences(updatedPrefs);
    
    if (newPreferences.theme !== undefined) {
      if (newPreferences.theme === 'dark') {
        setIsDarkMode(true);
      } else if (newPreferences.theme === 'light') {
        setIsDarkMode(false);
      } else {
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      }
    }
  }, [preferences]);

  // ✅ Place Order
  const handleOrderNow = async () => {
    if (!user) {
      Alert.alert("⚠️ Login Required", "Please login to place an order");
      return;
    }

    if (isLoading) return;

    try {
      console.log("📡 Connecting to API:", API_URL);

      const currentCart = [...cart];
      if (currentCart.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Empty Cart',
          text2: 'Your cart is empty',
        });
        return;
      }

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

      console.log("🗺️ User Location:", userLocation);

      await AsyncStorage.setItem("userLocation", JSON.stringify(userLocation));

      const grandTotal = currentCart.reduce((total, item) => total + item.price * item.quantity, 0);
      const vendorId = "67dbc243153a18be6ef0c5f0";

      console.log("🛒 Final Order Data:", {
        userId: user._id,
        userName: user.name,
        vendorId,
        name: user.name,
        phone: user.phone,
        address: user.address,
        userLocation,
        cartItems: currentCart,
        grandTotal,
        status: "Pending",
      });

      const response = await axios.post(`${API_URL}/orders/add-order`, {
        userId: user._id,
        userName: user.name,
        vendorId,
        name: user.name,
        phone: user.phone,
        address: user.address,
        userLocation,
        cartItems: currentCart,
        grandTotal,
        status: "Pending",
      });

      if (response.status === 201) {
        Toast.show({
          type: 'success',
          text1: 'Order Placed!',
          text2: 'Your order has been submitted successfully',
        });
        setCart([]);
        await AsyncStorage.removeItem(getCartStorageKey(user._id));
      }
    } catch (error) {
      console.error("❌ Order Placement Error:", error);
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: 'Could not place order. Please try again.',
      });
    }
  };

  // Combine user cart and temp cart for display
  const displayCart = user ? cart : tempCart;

  return (
    <AppContext.Provider value={{
      user, 
      vendorId, 
      cart: displayCart, 
      addToCart, 
      removeFromCart, 
      updateCartQuantity, 
      handleOrderNow, 
      searchValue, 
      setSearchValue,
      cartItemCount,
      isDarkMode,
      toggleTheme,
      preferences,
      updatePreferences,
      isLoading,
      isReady,
    }}>
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