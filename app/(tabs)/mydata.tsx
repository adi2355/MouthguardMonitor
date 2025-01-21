import { Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";
import { useState, useEffect } from "react";
import { AverageHourCount, BongHit, BongHitStats, Datapoint } from "@/util/common-types";
import { BONG_HITS_DATABASE_NAME, dayLookUpTable} from "@/util/utils";
import { Card } from "@/components/Card";
import AntDesign from '@expo/vector-icons/AntDesign';
import { Link } from "expo-router";
import { LineChart, BarChart } from "react-native-chart-kit";


const monthlyDataFake = {
    labels: ["January", "February", "March", "April", "May", "June"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // optional
        strokeWidth: 3 // optional
      }
    ],
    legend: ["Hits Recorded"] // optional
  };

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

//   const chartConfig = {
//     backgroundGradientFrom: "#f7f7f7",
//     backgroundGradientFromOpacity: 0,
//     backgroundGradientTo: "#f7f7f7",
//     backgroundGradientToOpacity: .0,
//     color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//     strokeWidth: 2, // optional, default 3
//     barPercentage: 0.5,
//     useShadowColorFromDataset: false // optional
//   };

const chartConfig = {
    backgroundColor: '#ffffff', // Chart background color
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2, // No decimal points
    color: () => `rgba(0, 128, 0, 1)`, // Green for text and lines
    fillShadowGradient: `rgba(0, 128, 0, 1)`, // Opaque green for bars
    fillShadowGradientOpacity: 1, // Fully opaque bars
    barPercentage: 0.5, // Adjust bar width
    labelColor: () => '#000000', // Black labels
    propsForBackgroundLines: {
      strokeWidth: 0, // Removes background grid lines
    },
    useShadowColorFromDataset: false, // Avoid shadow gradient interference
  };

  
export default function MyData() {
    const [weeklyHitsBarGraphProps, setWeeklyHitsBarGraphProps] = useState<Datapoint[]>();
    const [dailyStatsOverview, setDailyStatsOverview] = useState<Object>();
    const [bongHitStats, setBongHitStats] = useState<BongHitStats>();

    useEffect(() => {
        getBongHitStatsFromPastWeek();
        queryNumberOfHitsFromPastWeek();
        getDailyAverageDatapoints();
    }, []);

    async function queryNumberOfHitsFromPastWeek() {
        try {
            const bongHitsDb: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
            const bongHits: BongHit[] = await bongHitsDb.getAllAsync(
                `SELECT timestamp, duration_ms FROM ${BONG_HITS_DATABASE_NAME} WHERE TIMESTAMP >= DATETIME('now', '-7 days')`
            );
            const occurrenceMap: Map<number, number> = bongHits.reduce((map, bongHit) => {
                const date = new Date(bongHit.timestamp).getDay()
                map.set(date, (map.get(date) || 0) + 1);
                return map;
            }, new Map<number, number>());

            //Back fill days with zero if there are missing days from the past week.
            if (occurrenceMap.size < 7) {
                for (let i = 0; i < 7; i++) {
                    if(!occurrenceMap.has(i)){
                        occurrenceMap.set(i, 0);
                    }
                }
            }

            const numberOfHits: Datapoint[] = [];
            occurrenceMap.forEach((value, key) => {
                numberOfHits.push({
                    label: dayLookUpTable.get(key)!,
                    value: value
                });
            });
            console.log(numberOfHits)
            setWeeklyHitsBarGraphProps(numberOfHits)
        } catch (e) {
            console.error(e);
        }
    }

    async function getDailyAverageDatapoints() {
        try {
            const bongHitsDb: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
            let avgHourCount: AverageHourCount[] = await bongHitsDb.getAllAsync(
                `
                    SELECT  strftime('%H', timestamp) AS hourOfDay, COUNT(*) AS count
                    FROM ${BONG_HITS_DATABASE_NAME}
                    GROUP BY hourOfDay
                    ORDER BY hourOfDay;
                `
            );
            //Back fill if any hour DNE in database
            if (avgHourCount.length < 24) {
                // Create an array with all hours (00 to 23)
                const allHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
                const dataMap = new Map(avgHourCount.map(item => [item.hourOfDay, item.count]));

                avgHourCount = allHours.map(hour => ({
                    count: dataMap.get(hour) || 0,
                    hourOfDay: hour
                }));
            }
            
            let labels: string[] = [];
            let values: number[] = [];
            avgHourCount.forEach(item =>{
                labels.push(item.hourOfDay);
                values.push(item.count);
            });
            const dailyAvgData = {
                labels: ["12am", "6am", "12pm", "6pm", "12am"],
                datasets: [
                  {
                    data: values,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // optional
                    strokeWidth: 2 // optional
                  }
                ],
                legend: ["Average daily hits"] // optional
              };

            setDailyStatsOverview(dailyAvgData)
        } catch (e) {
            console.error(e);
        }
    }

    async function getBongHitStatsFromPastWeek() {
        try {
            const bongHitsDb: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
            const bongHits: any | null = await bongHitsDb.getFirstAsync(`SELECT AVG(duration_ms) FROM ${BONG_HITS_DATABASE_NAME} WHERE TIMESTAMP >= DATETIME('now', '-7 days')`);
            const longestHit: any | null = await bongHitsDb.getFirstAsync(`SELECT MAX(duration_ms) FROM ${BONG_HITS_DATABASE_NAME} WHERE TIMESTAMP >= DATETIME('now', '-7 days')`);
            setBongHitStats({
                longestHit: longestHit["MAX(duration_ms)"],
                averageDuration: bongHits["AVG(duration_ms)"]
            });

        } catch(e) {
            console.error(e);
        }
    }


    return (
        <SafeAreaProvider style = {styles.scrollView}>
            <ScrollView>
                <Link href={`/dataOverviews/dailyAverageOverview`} style={styles.cards}>
                    <Card >
                        <Text style={styles.header}>Daily Average Overview</Text>
                        {dailyStatsOverview ? <LineChart data={dailyStatsOverview as any}  width={300} height={200} chartConfig={chartConfig}/> : <Text>Loading</Text>}
                    </Card>
                </Link>

                <Link href={`/dataOverviews/weeklyOverview`} style={styles.cards}>
                    <Card >
                        
                        <Text style={styles.header}>Past Week Overview</Text>
                        {weeklyHitsBarGraphProps ? <BarChart data={weeklyDataFake} width={300} height={200} chartConfig={chartConfig} /> : <Text>Loading</Text>}
                    </Card>
                </Link>
                <Card style={styles.cards}>
                    <Text style={styles.header}>Past Month Overview</Text>
                    {weeklyHitsBarGraphProps ? <LineChart data={monthlyDataFake} width={500} height={300} chartConfig={chartConfig}/> : <Text>Loading</Text>}
                </Card>
                <Card style={styles.cards}>
                    <Text style={styles.header}>Pick Time Range</Text>
                    <AntDesign name="calendar" size={24} color="black" />
                </Card>
            </ScrollView>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    header: {
        fontSize: 18
    },
    scrollView: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',  
        alignItems: 'center',    
        margin: 20
      },
      cards: {
        marginVertical: 40
      }
});