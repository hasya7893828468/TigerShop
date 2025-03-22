import React, { useRef } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Search, X } from "lucide-react-native";
import { useAppContext } from "./AppContext"; // ✅ Ensure correct path

const SearchBar: React.FC = () => {
  const { searchValue, setSearchValue } = useAppContext(); // ✅ Ensure it's inside AppProvider
  const inputRef = useRef<TextInput | null>(null);

  return (
    <View style={styles.container}>
      <Search size={20} color="gray" style={styles.icon} />
      <TextInput
        ref={inputRef}
        placeholder="Search products..."
        value={searchValue ?? ""} // ✅ Ensure safe value
        onChangeText={(text) => setSearchValue(text)} // ✅ Updates context state
        style={styles.input}
      />
      {searchValue.length > 0 && (
        <TouchableOpacity onPress={() => setSearchValue("")} style={styles.clearButton}>
          <X size={20} color="gray" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 8,
  },
});

export default SearchBar;
