import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (!storedUser) {
          Alert.alert("Session Expired", "Please log in again.");
          return router.replace("/LoginScreen");
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert("Logged Out", "You have been logged out.");
      router.replace("/LoginScreen");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View> */}

      {/* Profile Content */}
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {user?.name ? (
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={60} color="#fff" />
            )}
          </View>
          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>

        {/* Details Section */}
        {user ? (
          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={24} color="#6C63FF" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{user.name}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={24} color="#6C63FF" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={24} color="#6C63FF" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{user.phone || "Not provided"}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailItem}>
              <Ionicons name="home-outline" size={24} color="#6C63FF" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{user.address || "Not provided"}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>User data not found</Text>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7'
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#6C63FF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: 20
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  userEmail: {
    fontSize: 16,
    color: '#666'
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  detailTextContainer: {
    marginLeft: 15
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5
  },
  logoutButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 20
  }
});