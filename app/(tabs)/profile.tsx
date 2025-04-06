import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Image,
  ScrollView,
  TextInput
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

// Validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePhone = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return re.test(phone);
};

// Reusable components
const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={24} color="#6C63FF" />
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const Separator = () => <View style={styles.separator} />;

const FormField = ({ label, value, onChangeText, error, icon, ...props }) => (
  <View style={styles.formField}>
    <View style={styles.fieldHeader}>
      <Ionicons name={icon} size={20} color="#6C63FF" />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Main Profile Screen Component
export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (!storedUser) {
          Alert.alert("Session Expired", "Please log in again.");
          return router.replace("/LoginScreen");
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);
        setAvatarUri(userData?.avatar || null);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Toast.show({
          type: 'error',
          text1: 'Profile Error',
          text2: 'Failed to load profile details.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", onPress: performLogout }
      ]
    );
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.clear();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.'
      });
      router.replace("/Logout");
    } catch (error) {
      console.error("Logout error:", error);
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not complete logout. Please try again.'
      });
    }
  };

  const handleEditProfile = () => {
    router.push({
      pathname: "/EditProfileScreen",
      params: { user: JSON.stringify(user) }
    });
  };

  const updateAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "Please enable photo access to upload images.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      const updatedUser = { ...user, avatar: result.assets[0].uri };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
      setUser(updatedUser);
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={updateAvatar}
            accessibilityLabel="Change profile photo"
          >
            {avatarUri ? (
              <Image 
                source={{ uri: avatarUri }} 
                style={styles.avatarImage} 
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'G'}
                </Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>

        {/* Details Section */}
        {user ? (
          <View style={styles.detailsCard}>
            <DetailRow 
              icon="person-outline"
              label="Full Name"
              value={user.name}
            />
            <Separator />
            <DetailRow
              icon="mail-outline"
              label="Email Address"
              value={user.email}
            />
            <Separator />
            <DetailRow
              icon="call-outline"
              label="Phone Number"
              value={user.phone || "Not provided"}
            />
            <Separator />
            <DetailRow
              icon="home-outline"
              label="Address"
              value={user.address || "Not provided"}
            />
          </View>
        ) : (
          <Text style={styles.errorText}>User data not found</Text>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
      
          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Toast />
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 20
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 15,
    padding: 5
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  detailTextContainer: {
    marginLeft: 15,
    flex: 1
  },
  detailLabel: {
    fontSize: 14,
    color: '#666'
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8
  },
  buttonGroup: {
    gap: 12
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    elevation: 2
  },
  editButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6C63FF'
  },
  editButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10
  },
  logoutButton: {
    backgroundColor: '#6C63FF'
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10
  },
  formField: {
    marginBottom: 16
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  fieldLabel: {
    marginLeft: 8,
    color: '#444',
    fontSize: 14
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  inputError: {
    borderColor: '#ff4444'
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4
  }
});

// Export both screens
