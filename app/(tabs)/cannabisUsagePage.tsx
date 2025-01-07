import { Button, Text, ScrollView } from "react-native";
import BarGraph, { Datapoint } from "@/components/BarGraph";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";
import { useState, useEffect } from "react";
import { BongHit } from "@/util/common-types";
import { BONG_HITS_DATABASE_NAME, dayLookUpTable} from "@/util/utils";

export default function CannabisUsagePage() {
    const [weeklyHitsBarGraphProps, setWeeklyHitsBarGraphProps] = useState<Datapoint[]>();
    useEffect(() => {
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
                for(let i = 0; i < 7; i++){
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

    return (
        <SafeAreaProvider style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ScrollView >
                <Text style={{ marginBottom: 20, marginTop: 20 }}>Number of Bong Hits Taken This Week</Text>
                { weeklyHitsBarGraphProps ? ( <BarGraph data={weeklyHitsBarGraphProps} /> ) : <Text>Loading...</Text> }
                <Button title={"gethitsperday"} onPress={queryNumberOfHitsFromPastWeek} />
            </ScrollView>
        </SafeAreaProvider>

    )
}