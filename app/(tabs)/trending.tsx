import { Card } from "@/components/Card";
import Leaderboard from "@/components/Leaderboard";
import { SafeAreaView, StyleSheet } from "react-native";

export default function Trending() {

    const sampleData = [
        { id: '1', name: 'Blue Dream', score: 95 },
        { id: '2', name: 'OG Kush', score: 85 },
        { id: '3', name: 'Gorilla Glue', score: 70 },
        { id: '4', name: 'Gelato', score: 60 },
        { id: '5', name: 'Lemon Haze', score: 85 },
        { id: '6', name: 'Sour Diesel', score: 70 },
        { id: '7', name: 'Skywalker OG', score: 60 },
        { id: '8', name: 'Jack Herrer', score: 5 },
        { id: '9', name: 'Wedding Cake', score: 20 },
        { id: '10', name: 'Girl Scout Cookies', score: 9 },
      ];
    
      return (
        <SafeAreaView style={styles.safeAreaViewContainer}>
            <Card style={styles.cardContainer}>
                <Leaderboard title={"Trending Strains"}data={sampleData} />
            </Card>
        </SafeAreaView>
      );
    
}
const styles = StyleSheet.create({ 
    safeAreaViewContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        margin: 30,
    },
    cardContainer: {
        flex: 1
    }
});