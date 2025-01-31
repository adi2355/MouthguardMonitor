export interface BongHit {
    timestamp: string;
    duration_ms: number;
}

export interface BongHitStats {
    longestHit: number;
    averageDuration: number;
}

export interface AverageHourCount {
    count: number;
    hourOfDay: string;
}

export interface Datapoint {
    label: string;
    value: number;
}