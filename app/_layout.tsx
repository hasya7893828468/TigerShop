import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppProvider from "./context/AppContext"; // ✅ Context Wrapper

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Slot />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
