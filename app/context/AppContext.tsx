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
  
    const fetchData = async () => {
      setIsLoading(true);
      try {
        isDataLoaded.current = true;
        console.log("🟠 Initializing app...");
  
        // Load guest cart (before user check)
        const guestCart = await AsyncStorage.getItem(getGuestCartKey());
        if (guestCart) {
          console.log("🛒 Guest cart found in AsyncStorage");
          setTempCart(JSON.parse(guestCart));
        }
  
        const token = await AsyncStorage.getItem("authToken");
        const storedUserId = await AsyncStorage.getItem("userId");
  
        if (!token || !storedUserId) {
          console.log("❌ No auth token or userId found - user not logged in");
          setUser(null);
          setIsLoading(false);
          setIsReady(true);
          return;
        }
  
        console.log("🟢 Found userId:", storedUserId);
  
        // Load cached user data first
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUser(parsedUser);
          console.log("📦 Using cached user data:", parsedUser);
        }
  
        // Fetch fresh user data from backend
        const userResponse = await axios.get(`${API_URL}/auth/user/${storedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const fetchedUser = userResponse.data;
        setUser(fetchedUser);
        console.log("✅ Fetched user data from API:", fetchedUser);
  
        // Update AsyncStorage with latest user data
        await AsyncStorage.setItem("userData", JSON.stringify(fetchedUser));
        await AsyncStorage.setItem("userId", fetchedUser._id);
  
        // Load user preferences
        const storedPrefs = await AsyncStorage.getItem(getPreferencesKey(fetchedUser._id));
        if (storedPrefs) {
          const parsedPrefs = JSON.parse(storedPrefs);
          setPreferences(parsedPrefs);
          if (
            parsedPrefs.theme === 'dark' ||
            (parsedPrefs.theme === 'system' && Appearance.getColorScheme() === 'dark')
          ) {
            setIsDarkMode(true);
          } else {
            setIsDarkMode(false);
          }
        }
  
        // Load cart from storage
        const storedCart = await AsyncStorage.getItem(getCartStorageKey(fetchedUser._id));
        if (storedCart) {
          setCart(JSON.parse(storedCart));
          console.log("🛒 Cart restored from AsyncStorage");
          Toast.show({
            type: 'info',
            text1: 'Cart Restored',
            text2: 'Your previous cart items have been restored',
          });
        }
      } catch (error) {
        console.error("❌ Error during initialization:", error?.response?.data || error);
        if (error?.response?.status === 401) {
          console.warn("🔒 Token expired or invalid, logging out user...");
          await AsyncStorage.multiRemove(["authToken", "userId", "userData"]);
          setUser(null);
        }
      } finally {
        console.log("✅ Initialization complete");
        setIsLoading(false);
        setIsReady(true);
      }
    };
  
    fetchData();
  }, []);
  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
  
    loadUser();
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
    console.log("🛒 Attempting to add item:", item);
    console.log("👤 User:", user);
    console.log("⏳ isLoading:", isLoading);
    console.log("🟢 isReady:", isReady);
  
    if (isLoading || !isReady) {
      console.warn("⏳ App not ready yet, blocking cart interaction");
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: "App is initializing",
      });
      return;
    }
  
    // ✅ Updated login check to support both `id` and `_id`
    const userId = user?._id || user?.id;
    if (!user || !userId) {
      console.warn("🚫 User not logged in - blocking cart action.");
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please log in to add items to the cart.",
      });
      return;
    }
  
    const operation = (prevItems: CartItem[]) => {
      const existingItem = prevItems.find(
        (cartItem) => cartItem._id === item._id && cartItem.userId === userId
      );
  
      const updatedItems = existingItem
        ? prevItems.map((cartItem) =>
            cartItem._id === item._id && cartItem.userId === userId
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          )
        : [...prevItems, { ...item, userId }];
  
      saveCartToStorage(updatedItems);
      return updatedItems;
    };
  
    setCart(operation);
  
    Toast.show({
      type: "success",
      text1: "✅ Added to Cart",
      text2: `${item.name} (${item.quantity}) added to cart!`,
      visibilityTime: 2000,
      position: "bottom",
    });
  }, [user, isLoading, isReady, setCart]);
  
  

  useEffect(() => {
    console.log("👀 User updated:", user);
    console.log("🟢 isReady updated:", isReady);
  }, [user, isReady]);
  


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
    if (isLoading) return;

    try {
        console.log("📡 Connecting to API:", API_URL);

        // Check user authentication
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
            Alert.alert("⚠️ Authentication Error", "Please log in to place an order.");
            return;
        }

        // Fetch fresh user data to ensure correct userId
        const storedUserId = await AsyncStorage.getItem("userId");
        if (!storedUserId) {
            Alert.alert("⚠️ User Data Missing", "Please log in again.");
            return;
        }

        const userResponse = await axios.get(`${API_URL}/auth/user/${storedUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const user = userResponse.data;
        console.log("✅ Fresh User Data:", user);

        const currentCart = [...cart];
        if (currentCart.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Empty Cart',
                text2: 'Your cart is empty',
            });
            return;
        }

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("⚠️ Location Permission", "Please enable location services.");
            return;
        }

        // Get the current location
        let location;
        try {
            location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,  // Maximum precision
                timeout: 10000,  // 10 seconds timeout
            });
        } catch (err) {
            console.error("❌ Location Fetch Error:", err);
            Alert.alert("⚠️ Location Error", "Unable to fetch your location. Try again.");
            return;
        }

        const userLocation = {
            latitude: parseFloat(location.coords.latitude.toFixed(8)),  // 8 decimal places
            longitude: parseFloat(location.coords.longitude.toFixed(8)),
        };

        console.log("🗺️ User Location:", userLocation);

        // Store the location in AsyncStorage for future reference
        await AsyncStorage.setItem("userLocation", JSON.stringify(userLocation));

        const grandTotal = currentCart.reduce((total, item) => total + item.price * item.quantity, 0);
        const vendorId = "67dbc243153a18be6ef0c5f0";

        const orderData = {
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
        };

        console.log("🛒 Final Order Data:", orderData);

        const response = await axios.post(`${API_URL}/orders/add-order`, orderData);

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
      user, setUser,
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