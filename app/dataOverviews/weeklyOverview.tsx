import { View, Text, StyleSheet } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

const weeklyDataFake = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        data: [9, 4, 2, 0, 15, 4, 10],
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // optional
        strokeWidth: 3 // optional
      }
    ],
    legend: ["Hits Recorded"] // optional
  };

  const changeOverTimeDataFakse = {
    labels: ["12/22-12/28", "12/29-1/4", "1/5-1/11", "1/12-1/18"],
    datasets: [
      {
        data: [40, 50, 30, 20],
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // optional
        strokeWidth: 3 // optional
      }
    ],
    legend: ["Hits Recorded"] // optional
  };

const chartConfig = {
    backgroundGradientFrom: "#f7f7f7",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#f7f7f7",
    backgroundGradientToOpacity: 0.0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false // optional
};

export default function WeeklyOverview() {
    return(
        <View style={styles.container}>
            <Text style={styles.h1}>Weekly Overview</Text>
            
            <Text style={[styles.h2, {marginTop: 30}]}># of Hits This Week</Text>
            <BarChart data={weeklyDataFake} chartConfig={chartConfig} width={400} height={200} />
            <Text style={[styles.h2, {marginTop: 30}]}>Change Over Time</Text>
            <LineChart data={changeOverTimeDataFakse} width={400} height={300} chartConfig={chartConfig} bezier/>
            <Text style={styles.h2}> Usage Down 15% from Last Week</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    h1: {
        fontSize: 20
    },
    h2: {
        fontSize: 18
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',    
        margin: 20
      },
});