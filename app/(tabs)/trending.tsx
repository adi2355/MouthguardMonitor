import { Card } from "@/components/Card";
import Leaderboard from "@/components/Leaderboard";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";

export default function Trending() {

    const sampleData = [
        { id: '1', name: 'Alice', score: 95 },
        { id: '2', name: 'Bob', score: 85 },
        { id: '3', name: 'Charlie', score: 70 },
        { id: '4', name: 'Diana', score: 60 },
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
        justifyContent: 'center',  
        alignItems: 'center',
        flex: 1,
        margin: 30
    },
    cardContainer: {
        flex: 1,
    }
});