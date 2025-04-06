import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const GEMINI_API_KEY = "AIzaSyB6x7PoPgigfw0S7OyMs-NkRoM1nKA8Jdo"; // Replace with your actual API key

const ChatScreen = () => {
  const [messages, setMessages] = useState<
    { id: string; text: string; sender: "user" | "ai"; image?: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() && !image) return;

    const userMessage = { id: Date.now().toString(), text: input, sender: "user", image };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setImage(null);
    setLoading(true);

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: input }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: aiResponse, sender: "ai" }]);

      // If the AI response contains image-related keywords, generate an image
      if (aiResponse.toLowerCase().includes("generate image")) {
        generateImage(aiResponse);
      }
    } catch (error) {
      console.error("Gemini API Error:", error.response?.data || error.message);
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: "Error fetching response.", sender: "ai" }]);
    } finally {
      setLoading(false);
    }
  };

  // Free image generation using Lexica API
  const generateImage = async (text: string) => {
    try {
      const response = await axios.get(`https://lexica.art/api/v1/search?q=${encodeURIComponent(text)}`);
      const imageUrl = response.data?.images?.[0]?.src || null;

      if (imageUrl) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), text, sender: "ai", image: imageUrl }]);
      }
    } catch (error) {
      console.error("Image Generation Error:", error.message);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.message, item.sender === "user" ? styles.userMessage : styles.aiMessage]}>
            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
            <Text style={[styles.messageText, item.sender === "ai" && styles.aiText]}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.chatContainer}
      />

      {loading && <ActivityIndicator size="small" color="#3b82f6" style={styles.loadingIndicator} />}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Ionicons name="image" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={!input.trim() && !image}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  chatContainer: { padding: 16, paddingBottom: 60 },
  message: { padding: 12, borderRadius: 10, marginBottom: 10, maxWidth: "80%", elevation: 2 },
  userMessage: { backgroundColor: "#3b82f6", alignSelf: "flex-end" },
  aiMessage: { backgroundColor: "#e5e7eb", alignSelf: "flex-start" },
  messageText: { fontSize: 16, color: "#fff" },
  aiText: { color: "#1e293b" },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    marginRight: 10,
    color: "#1e293b",
  },
  sendButton: { backgroundColor: "#3b82f6", padding: 12, borderRadius: 10 },
  imageButton: { padding: 10, marginRight: 10 },
  loadingIndicator: { marginBottom: 10, alignSelf: "center" },
  image: { width: 150, height: 150, borderRadius: 8, marginBottom: 5 },
});

export default ChatScreen;
