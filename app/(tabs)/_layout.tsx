import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RocketIcon } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "AI ",
          tabBarIcon: ({ color, size }) => <RocketIcon name="Ai - chat" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
