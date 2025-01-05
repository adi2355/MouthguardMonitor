import { View } from "react-native";
import BarGraph, { Datapoint } from "@/components/BarGraph";

const datapoints: Array<Datapoint> = [
    { label: 'Jan', value: 150 },
    { label: 'Feb', value: 100 },
    { label: 'Mar', value: 171 },
    { label: 'Apr', value: 300 },
    { label: 'May', value: 200 },
];

export default function CannabisUsagePage() {
    return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <BarGraph data={datapoints} />
        </View>
    )
}