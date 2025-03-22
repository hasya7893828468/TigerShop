import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { ShoppingCart, ShoppingBag, MoreVertical, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppContext } from "../context/AppContext";
import MenuDropdown from "./MenuDropdown";
import CartSidebar from "./CartSidebar";

const NavBar: React.FC = () => {
  const { cart } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => router.push("/Main")} style={styles.logo}>
        <ShoppingBag size={24} color="black" />
        <Text style={styles.brand}>ShivaStore</Text>
      </TouchableOpacity>

      <View style={styles.iconsContainer}>
        <TouchableOpacity onPress={() => setIsCartOpen(true)} style={styles.cartContainer}>
          <ShoppingCart size={24} color="black" />
          {cart.length > 0 && <Text style={styles.cartBadge}>{cart.length}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)}>
          <User size={24} color="black" />
        </TouchableOpacity>
      </View>

      {isMenuOpen && <MenuDropdown />}

      {/* Full-screen Cart Modal */}
      <Modal visible={isCartOpen} animationType="slide" transparent={true}>
        <CartSidebar onClose={() => setIsCartOpen(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
   
    elevation: 4,
  },
  logo: { flexDirection: "row", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "bold", color: "#023e8a", marginLeft: 5 },
  iconsContainer: { 
    flexDirection: "row",
    alignItems: "center"
  },
  cartContainer: { 
    position: "relative",
    marginRight: 10, // Move cart icon 10px to the right
    
  },
  cartBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "red",
    color: "white",
    borderRadius: 10,
    paddingHorizontal: 6,
    fontSize: 12,
  },
});

export default NavBar;
