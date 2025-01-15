import { Text, ScrollView, StyleSheet } from "react-native";
import BarGraph, { Datapoint } from "@/components/BarGraph";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";
import { useState, useEffect } from "react";
import { BongHit, BongHitStats } from "@/util/common-types";
import { BONG_HITS_DATABASE_NAME, dayLookUpTable} from "@/util/utils";
import { Card } from "@/components/Card";
import AntDesign from '@expo/vector-icons/AntDesign';

export default function MyData() {
    const [weeklyHitsBarGraphProps, setWeeklyHitsBarGraphProps] = useState<Datapoint[]>();
    const [bongHitStats, setBongHitStats] = useState<BongHitStats>();

    useEffect(() => {
        getBongHitStatsFromPastWeek();
        queryNumberOfHitsFromPastWeek();
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
                <Card style={styles.cards}>
                    <Text style={styles.header}>Today's Overview</Text>
                    {weeklyHitsBarGraphProps ? <BarGraph data={weeklyHitsBarGraphProps}/> : <Text>Loading</Text>}
                </Card>
                <Card style={styles.cards}>
                    <Text style={styles.header}>Past Week Overview</Text>
                    {weeklyHitsBarGraphProps ? <BarGraph data={weeklyHitsBarGraphProps}/> : <Text>Loading</Text>}
                </Card>
                <Card style={styles.cards}>
                    <Text style={styles.header}>Past Month Overview</Text>
                    {weeklyHitsBarGraphProps ? <BarGraph data={weeklyHitsBarGraphProps}/> : <Text>Loading</Text>}
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