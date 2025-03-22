// import { useEffect, useState } from "react";
// import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";

// export default function Home() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let isMounted = true; // ✅ Prevent state updates on unmounted component

//     const checkAuth = async () => {
//       try {
//         const token = await AsyncStorage.getItem("userToken");

//         if (!token) {
//           if (isMounted) router.replace("/login");
//         } else {
//           if (isMounted) setLoading(false);
//         }
//       } catch (error) {
//         console.error("❌ Error checking auth:", error);
//       }
//     };

//     checkAuth();

//     return () => {
//       isMounted = false; // ✅ Cleanup function
//     };
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#007bff" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to the Main Page!</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f9f9f9",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333",
//   },
// });
