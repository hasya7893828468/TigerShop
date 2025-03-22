import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Modal, Pressable } from "react-native";
import { MoreVertical, User } from "lucide-react-native";
import { useRouter } from "expo-router";

const MenuDropdown: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Three Dots Button */}
      <TouchableOpacity onPress={() => setIsVisible(true)} style={styles.menuButton}>
        <User size={24} color="black" />
      </TouchableOpacity>

      {/* Modal for Dropdown (Ensures it stays on top) */}
      <Modal transparent visible={isVisible} animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsVisible(false)}>
          <View style={styles.menu}>
            <TouchableOpacity onPress={() => { router.push("/Login"); setIsVisible(false); }} style={styles.menuItem}>
              <Text>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { router.push("/profile"); setIsVisible(false); }} style={styles.menuItem}>
              <Text>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { router.push("/comp/MyOrders"); setIsVisible(false); }} style={styles.menuItem}>
              <Text>📦 My Orders</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 100,
  },
  menuButton: {
    padding: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menu: {
    backgroundColor: "#fff",
    marginTop: 50,
    marginRight: 10,
    padding: 10,
    borderRadius: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  menuItem: {
    paddingVertical: 8,
  },
});

export default MenuDropdown;
