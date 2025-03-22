import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";

// ✅ Define TypeScript interface for items
interface KfcItem {
  id: number;
  image: any; // Image source
  name: string;
}

// ✅ KFC Menu Data (Images should be in assets folder)
const Kfc: KfcItem[] = [
  { id: 1, image: require("../comp/images/download__2_-removebg-preview.png"), name: "ALL" },
  { id: 2, image: require("./images/Blueberry-Lavender_Ice_Cream-removebg-preview.png"), name: "IceCream" },
  { id: 3, image: require("./images/download__1_-removebg-preview.png"), name: "Crispy" },
  { id: 4, image: require("./images/Unlock_the_Secret_of_the_Perfect_Rum_Cocktail___Are_You_Ready__54-removebg-preview.png"), name: "Drinks" },
];

interface HomeCardProps {
  name: string;
}

const HomeCard: React.FC<HomeCardProps> = ({ name }) => {
  const router = useRouter(); // ✅ React Native Navigation

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {Kfc.map((item, index) => {
            // ✅ Define route dynamically
            const route =
              index === 1 ? "/comp/Drinks" : index === 2 ? "/comp/Groceries" : index === 3 ? "/comp/Snacks" : "/Main";

            return (
              <TouchableOpacity key={item.id} onPress={() => router.push(route)} style={styles.card}>
                <Image source={item.image} style={styles.image} resizeMode="contain" />
                <Text style={styles.cardText}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeCard;

// ✅ Styles for better UI
const styles = StyleSheet.create({
  container: { padding: 1, },
  header: { fontSize: 20, fontWeight: "bold", },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "nowrap", // Ensure no wrapping
    alignItems: "center",
    borderRadius:30,
  },
  card: {
    alignItems: "center",
      marginRight: 1,
      marginLeft: 5,  // Add spacing between cards
    borderRadius: 10,
   
  },
  image: {
    width: 100,
    height: 60,
    borderRadius: 50,
  },
  cardText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom:5,
    
  },
});
