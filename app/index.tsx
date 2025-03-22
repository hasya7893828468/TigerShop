// app/index.tsx
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Welcome to the App
      </Text>
      <Button title="Go to Login" onPress={() => router.push("/Login")} />
      <Button title="Go to Sign Up" onPress={() => router.push("/SignUp")} />
      <Button title="Go to main " onPress={() => router.push("/Main")} />
      <Button title="Go tovender dash bord " onPress={() => router.push("/Vendor/VendorDashboard")} />

      <Button title="Go to shoes " onPress={() =>router.push("/comp/SnackManager")} />
      <Button title="Go to men  " onPress={() => router.push("/comp/DrinkManager")} />
      <Button title="Go to accessories
       " onPress={() =>router.push("/comp/GroceryManager")} />


    </View>
  );
}
