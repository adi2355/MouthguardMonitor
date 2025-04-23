// Core data types
export interface Athlete {
    id: string;
    name: string;
    team?: string;
    position?: string;
    age?: number;
    height?: string;
    weight?: string;
    deviceId?: string;
    notes?: string;
    number?: string;
    active?: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface SensorData {
    timestamp: number;
    values: number[];
}

export interface ImuData {
    id?: number;
    deviceId: string;
    sensorId: number;
    timestamp: number;
    x: number;
    y: number;
    z: number;
    createdAt: number;
}

export interface AccelerometerData {
    id?: number;
    deviceId: string;
    sensorId: number;
    timestamp: number;
    x: number;
    y: number;
    z: number;
    magnitude: number;
    createdAt: number;
}

export interface TemperatureData {
    id?: number;
    deviceId: string;
    sensorId: number;
    timestamp: number;
    temperature: number;
    createdAt: number;
}

export interface ForceData {
    id?: number;
    deviceId: string;
    sensorId: number;
    timestamp: number;
    force: number;
    createdAt: number;
}

export interface HeartRateData {
    id?: number;
    deviceId: string;
    timestamp: number;
    heartRate: number;
    createdAt: number;
}

export interface ImpactEvent {
    id?: number;
    deviceId: string;
    athleteId?: string;
    timestamp: number;
    magnitude: number;
    x: number;
    y: number;
    z: number;
    durationMs?: number;
    location?: string;
    processed: boolean;
    severity?: 'low' | 'moderate' | 'severe' | 'critical';
    notes?: string;
    createdAt: number;
}

// --- Device Packet Structures ---

// Matches C struct motion_packet
export interface MotionPacket {
  // All values are raw sensor readings
  gyro: [number, number, number];       // int16_t[3]
  accel16: [number, number, number];    // int16_t[3] (16g accelerometer)
  accel200: [number, number, number];   // int16_t[3] (200g accelerometer)
  mag: [number, number, number];        // int16_t[3]
  bite_l: number;                       // uint16_t
  bite_r: number;                       // uint16_t
  timestamp: number;                    // uint32_t (Device timestamp, likely seconds or custom epoch)
}

// Matches C struct fsr_packet
export interface FSRPacket {
  left_bite: number;                    // int16_t
  right_bite: number;                   // int16_t
  timestamp: number;                    // uint32_t (Device timestamp)
}

// Represents the Heart Rate Measurement characteristic data
export interface HRMPacket {
  flags: number;                        // uint8_t
  heartRate: number;                    // uint8_t or uint16_t depending on flags
  // Optional fields based on flags (energy expended, rr-interval) not included for simplicity
  deviceTimestamp?: number;             // Optional: Add if you plan to parse/estimate device time
  appTimestamp: number;                 // Timestamp when received by the app
}

// Represents the Health Thermometer Measurement characteristic data
export interface HTMPacket {
  flags: number;                        // uint8_t
  temperature: number;                  // IEEE-11073 float (parsed to a standard number)
  timestamp?: number;                   // Optional: Device timestamp if included based on flags
  type?: number;                        // Optional: Location type if included
  appTimestamp: number;                 // Timestamp when received by the app
}

export interface Session {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    team?: string;
    notes?: string;
    createdAt: number;
}

export interface SessionAthlete {
    sessionId: string;
    athleteId: string;
    startTime: number;
    endTime?: number;
}

export interface CalibrationData {
    id?: number;
    deviceId: string;
    sensorType: string;
    timestamp: number;
    offsetX?: number;
    offsetY?: number;
    offsetZ?: number;
    scaleX?: number;
    scaleY?: number;
    scaleZ?: number;
    createdAt: number;
}

// Chart-specific types
export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface ChartDataset {
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
    legend?: string[];
}

// Database types
export interface DatabaseRow {
    [key: string]: any;
}

// API Response types
export interface DatabaseResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface SavedDevice {
    id: string;
    name: string;
    lastConnected?: number; // Timestamp in milliseconds
    batteryLevel?: number; // Battery level (0-100)
    athleteId?: string; // ID of the athlete this device is assigned to
}

// Device status for multi-device management
export interface DeviceStatus {
    id: string;
    name: string;
    connected: boolean;
    batteryLevel?: number;
    lastSeen?: number;
    signalStrength?: number;
    athleteInfo?: {
        id: string;
        name: string;
    }
}

// Concussion alert/detection
export interface ConcussionAlert {
    id: string;
    deviceId: string;
    athleteId?: string;
    athleteName?: string;
    timestamp: number;
    magnitude: number;
    severity: 'low' | 'moderate' | 'severe' | 'critical';
    acknowledged: boolean;
    notes?: string;
    alertType?: 'impact' | 'temperature' | 'heartRate';
}

// Stats summaries
export interface SensorStats {
    deviceId: string;
    athleteId?: string;
    sensorType: 'imu' | 'accelerometer' | 'temperature' | 'force' | 'heartRate';
    min: number;
    max: number;
    avg: number;
    count: number;
    startTime: number;
    endTime: number;
}

// Live monitoring data point
export interface LiveDataPoint {
    deviceId: string;
    timestamp: number;
    type: 'imu' | 'accelerometer' | 'temperature' | 'force' | 'heartRate';
    values: number[];
}

// Session summary
export interface SessionSummary {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    athleteCount: number;
    impactCount: number;
    averageImpactMagnitude: number;
    maxImpactMagnitude: number;
    alerts: number;
}

// Reports
export interface ReportParameters {
    startTime: number;
    endTime: number;
    athleteIds?: string[];
    teamName?: string;
    includeAccelerometer?: boolean;
    includeImu?: boolean;
    includeTemperature?: boolean;
    includeForce?: boolean;
    includeHeartRate?: boolean;
    aggregation?: 'none' | 'minute' | 'hour' | 'day';
}

export interface AggregatedSensorData {
    timestamp: number;
    min: number;
    max: number;
    avg: number;
    count: number;
}

export interface AthleteReport {
    athlete: Athlete;
    totalSessions: number;
    totalImpacts: number;
    maxImpact: number;
    averageImpact: number;
    impactsByLevel: {
        low: number;
        moderate: number;
        severe: number;
        critical: number;
    };
    heartRateStats?: {
        min: number;
        max: number;
        avg: number;
    };
    sessionSummaries: Array<{
        sessionId: string;
        sessionName: string;
        date: number;
        impactCount: number;
        maxImpact: number;
    }>;
}

// State management types
export interface DataState {
    isLoading: boolean;
    error: string | null;
}

// Real-time monitoring session state
export interface MonitoringSessionState {
    active: boolean;
    sessionId?: string;
    sessionName?: string;
    startTime?: number;
    connectedDevices: DeviceStatus[];
    activeAlerts: ConcussionAlert[];
}
