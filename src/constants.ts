/**
 * Constants File
 * 
 * Original Author: Aditya Khetarpal | https://github.com/adi235
 * Part of the SandCHealth Mouthguard Monitoring Application
 * Attribution to the original author must be maintained in all derivatives.
 * 
 * AUTHOR_UUID: ADI-K-1ae4b98d-8a76-4f4c-9e2f-f90e2c5c1a71
 */

// src/constants.ts

// Database Name (Using a single DB as per current structure)
export const MOUTHGUARD_DB_NAME: string = "mouthguardMonitor.db";

// Application metadata (with embedded attribution)
export const APP_METADATA = {
  name: "Mouthguard Monitor",
  version: "1.0.0",
  author: "Aditya Khetarpal",
  authorUrl: "https://github.com/adi235",
  authorUuid: "ADI-K-1ae4b98d-8a76-4f4c-9e2f-f90e2c5c1a71"
};

// --- LIGHT MODE COLORS ---
export const COLORS = {
  // Core Palette
  primary: '#005432',       // Evergreen (For buttons, active icons, highlights)
  background: '#F8F9FA',    // Changed to lighter neutral background
  card: '#FFFFFF',          // White (Card backgrounds, slightly elevated)
  secondaryBackground: '#F8F8F8', // Lighter sand color as recommended

  // Text Palette
  textPrimary: '#303434',    // Soft Black (Primary text)
  textSecondary: '#6B7280',  // Slate (Secondary text, subtitles, labels)
  textTertiary: '#9CA3AF',   // Gray (Placeholder text, disabled text, subtle info)
  textOnPrimary: '#FFFFFF',  // White (Text on Evergreen buttons/elements)
  textAccent: '#005432',     // Evergreen (Links, highlighted values)

  // Accents (Use Sparingly!)
  accent1: '#9CCB3B',        // Apple (Maybe for specific highlights or success states)
  accent2: '#009374',        // Teal (Alternative accent, info indicators)
  accent3: '#006484',        // Storm (Another alternative accent)
  accent4: '#FFD60A',        // Apple Yellow (for temperature graph)
  accent5: '#80B0A6',        // Seaglass (Subtle accent or background)

  // Semantic Colors
  success: '#32D74B',        // Apple Green (using more pastel-toned green)
  warning: '#FF9500',        // Standard Orange
  error: '#FF453A',          // Apple Red (heart rate)
  info: '#0A84FF',           // Apple Blue (bite force)

  // Neutrals & Borders
  border: '#E5E7EB',         // Lighter border for softer appearance
  borderLight: '#F3F4F6',    // Even lighter border option
  inputBackground: '#F9FAFB', // Light gray for input fields
  disabled: '#D1D5DB',       // Disabled elements background/text
  shadow: '#000000',         // Black for shadows (used with low opacity)

  // Chart Colors
  chartBackground: '#1C1C1E', // Softer dark gray for chart backgrounds

  // Institutional (Use as needed for branding)
  instGreen: '#006747',
  instGold: '#CFC493',
  
  // Legacy structure maintained for backward compatibility
  text: {
    primary: '#303434',    // Map to textPrimary
    secondary: '#6B7280',  // Map to textSecondary
    tertiary: '#9CA3AF',   // Map to textTertiary
    onPrimary: '#FFFFFF',  // For text on primary colored backgrounds
  },
  cardBackground: '#FFFFFF', // Map to card
};

// --- NEW: Simulated Data based on Device Packets ---

export const DEVICE_ID_SIM = "simulated_mouthguard_1";

export const SIMULATED_MOTION_PACKET = {
  gyro: [10, -5, 2],          // Example raw values
  accel16: [100, -50, 1020],  // Example raw values (~1g Z if LSB = 1mg)
  accel200: [20, -10, 200],   // Example raw values
  mag: [300, -150, 500],      // Example raw values
  bite_l: 500,                // Example raw ADC value
  bite_r: 480,                // Example raw ADC value
  timestamp: Date.now(), // Use milliseconds for testing clarity
};

export const SIMULATED_FSR_PACKET = {
  left_bite: 510,             // Example raw value
  right_bite: 495,            // Example raw value
  timestamp: Date.now(), // Use milliseconds for testing clarity
};

// Simulating the raw byte format might be overly complex.
// Let's simulate the *parsed* data the app would likely use.
export const SIMULATED_HRM_DATA = {
  flags: 0b00000110, // uint8, sensor contact supported and detected
  heartRate: 75,
  appTimestamp: Date.now(), // Using current time
};

export const SIMULATED_HTM_DATA = {
  flags: 0b00000101, // Fahrenheit, Temp type present, no timestamp
  temperature: 98.6, // Parsed value in Fahrenheit
  type: 6, // Mouth location
  appTimestamp: Date.now(), // Using current time
};

// You might want an array for bulk injection
export const BULK_SIMULATED_MOTION = [
  { ...SIMULATED_MOTION_PACKET, timestamp: Date.now() },
  {
    gyro: [15, -8, 5], accel16: [110, -55, 1030], accel200: [25, -15, 210], mag: [310, -155, 505],
    bite_l: 550, bite_r: 530, timestamp: Date.now()
  },
  {
    gyro: [12, -7, 3], accel16: [105, -52, 1025], accel200: [22, -12, 205], mag: [305, -152, 502],
    bite_l: 520, bite_r: 500, timestamp: Date.now()
  },
];

export const BULK_SIMULATED_FSR = [
  { ...SIMULATED_FSR_PACKET, timestamp: Date.now() },
  { left_bite: 600, right_bite: 580, timestamp: Date.now() },
  { left_bite: 550, right_bite: 540, timestamp: Date.now() },
];

// --- KEEP Player Data and Other Constants ---

export const playerData = {
  id: "player_john_smith", // Added an ID
  name: "John Smith",
  sessions: [
    // --- Session 1 (Example with High Risk) ---
    {
      id: "session_abc_1",
      type: "Training",
      date: "02/19/2015", // Keep date format for now
      sport: "Football", // Added sport tag
      stats: {
        heartRate: { avg: 156, max: 190 },
        temperature: 98.2, // Assuming °F
        caloriesBurned: 743,
        acceleration: 12, // Assuming mph
        biteForce: 162, // Add units in display
        concussionRisk: "High", // CRITICAL for alert logic
        duration: "1h 21m",
      },
    },
    // --- Session 2 (Example with Low Risk) ---
    {
      id: "session_def_2",
      type: "Game",
      date: "02/10/2015",
      sport: "Football",
      stats: {
        heartRate: { avg: 165, max: 198 },
        temperature: 98.6,
        caloriesBurned: 1105,
        acceleration: 15,
        biteForce: 140,
        concussionRisk: "Low",
        duration: "2h 05m",
      },
    },
    // --- Add more sessions for history ---
    {
      id: "session_ghi_3",
      type: "Training",
      date: "02/05/2015",
      sport: "Football",
      stats: {
        heartRate: { avg: 140, max: 175 },
        temperature: 98.0,
        caloriesBurned: 650,
        acceleration: 10,
        biteForce: 155,
        concussionRisk: "Low",
        duration: "1h 10m",
      },
    },
  ],
  // --- Simulated Device Connection ---
  isDeviceConnected: true, // Toggle this to test connection status UI
};

export const coachData = {
    players: [
        // Include John Smith using the playerData structure
        { ...playerData },
        // Add other simulated players if needed for Coach View testing
        {
            id: 'player_jane_doe',
            name: 'Jane Doe',
            sessions: [
                {
                    id: "session_jkl_1",
                    type: "Training",
                    date: "02/19/2015",
                    sport: "Soccer",
                    stats: {
                        heartRate: { avg: 160, max: 185 },
                        temperature: 98.4,
                        caloriesBurned: 700,
                        acceleration: 14,
                        biteForce: 130,
                        concussionRisk: "Low",
                        duration: "1h 30m",
                    },
                },
            ],
            isDeviceConnected: true,
        },
        {
            id: 'player_bob_w',
            name: 'Bob Williams',
            sessions: [
                 {
                    id: "session_mno_1",
                    type: "Game",
                    date: "02/18/2015",
                    sport: "Hockey",
                    stats: {
                        heartRate: { avg: 170, max: 200 },
                        temperature: 98.8,
                        caloriesBurned: 1200,
                        acceleration: 18,
                        biteForce: 180,
                        concussionRisk: "Moderate", // Example other risk
                        duration: "2h 15m",
                    },
                },
            ],
            isDeviceConnected: false,
        }
    ]
};

// Sample Data for Testing

// --- Sample Athletes ---
const athlete1Id = 'athlete_1';
const athlete2Id = 'athlete_2';
const athlete3Id = 'athlete_3';

export const SAMPLE_ATHLETES = [
  {
    id: athlete1Id,
    name: 'Alice Johnson',
    team: 'Varsity Soccer',
    position: 'Forward',
    age: 17,
    height: '5\'7"',
    weight: '135 lbs',
    deviceId: 'mouthguard_A', // Assign a device
    notes: 'Previous concussion history (mild).',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
  },
  {
    id: athlete2Id,
    name: 'Bob Williams',
    team: 'Varsity Football',
    position: 'Linebacker',
    age: 18,
    height: '6\'1"',
    weight: '210 lbs',
    deviceId: 'mouthguard_B', // Assign a device
    notes: 'No known concussion history.',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  },
  {
    id: athlete3Id,
    name: 'Charlie Brown',
    team: 'JV Hockey',
    position: 'Defenseman',
    age: 16,
    height: '5\'10"',
    weight: '175 lbs',
    deviceId: null, // Unassigned device
    notes: '',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  },
];

// --- Sample Sensor Readings (Illustrative - Generating many is verbose) ---
// Structure: { table: string, data: Array<object> }
// Timestamps should be epoch milliseconds

const generateSensorData = (deviceId: string, sensorId: number, count: number, timeOffsetMs: number) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const timestamp = now - timeOffsetMs + (i * 100); // 10Hz data example
    data.push({
      deviceId: deviceId,
      sensorId: sensorId,
      timestamp: timestamp,
      x: (Math.random() - 0.5) * 10, // Example value range
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 10,
      createdAt: now,
    });
  }
  return data;
};

export const SAMPLE_SENSOR_READINGS = [
  {
    table: 'imu_data',
    data: [
      ...generateSensorData('mouthguard_A', 1, 5, 60000), // 5 readings, 1 min ago
      ...generateSensorData('mouthguard_B', 1, 3, 30000), // 3 readings, 30 sec ago
    ]
  },
  {
    table: 'accelerometer_data',
    data: [
      // Example high-G reading
      {
        deviceId: 'mouthguard_B', sensorId: 1, timestamp: Date.now() - 10000, // 10 sec ago
        x: 10.5, y: -50.2, z: 95.1, magnitude: 108.3, createdAt: Date.now()
      },
      // Normal readings
      {
        deviceId: 'mouthguard_A', sensorId: 1, timestamp: Date.now() - 5000, // 5 sec ago
        x: 0.1, y: -0.5, z: 1.1, magnitude: 1.2, createdAt: Date.now()
      },
    ]
  },
  {
    table: 'temperature_data',
    data: [
      { deviceId: 'mouthguard_A', sensorId: 1, timestamp: Date.now() - 120000, temperature: 36.5, createdAt: Date.now() },
      { deviceId: 'mouthguard_B', sensorId: 1, timestamp: Date.now() - 110000, temperature: 37.1, createdAt: Date.now() },
    ]
  },
  {
    table: 'force_data',
    data: [
      { deviceId: 'mouthguard_A', sensorId: 1, timestamp: Date.now() - 90000, force: 150.5, createdAt: Date.now() },
      { deviceId: 'mouthguard_B', sensorId: 2, timestamp: Date.now() - 85000, force: 210.0, createdAt: Date.now() },
    ]
  },
  {
    table: 'heart_rate_data',
    data: [
      { deviceId: 'mouthguard_A', timestamp: Date.now() - 15000, heartRate: 85, createdAt: Date.now() },
      { deviceId: 'mouthguard_B', timestamp: Date.now() - 10000, heartRate: 110, createdAt: Date.now() },
    ]
  }
];

// --- Sample Impact Events ---
export const SAMPLE_IMPACT_EVENTS = [
  {
    // id: Automatically generated
    deviceId: 'mouthguard_B',
    athleteId: athlete2Id, // Link to Bob Williams
    timestamp: Date.now() - 10000, // Matches accelerometer reading
    magnitude: 108.3,
    x: 10.5,
    y: -50.2,
    z: 95.1,
    durationMs: 15, // Example duration
    processed: false,
    severity: 'severe', // Example severity
    notes: 'Hit during tackle drill.',
    createdAt: Date.now(),
  },
  {
    deviceId: 'mouthguard_A',
    athleteId: athlete1Id,
    timestamp: Date.now() - 3 * 60 * 1000, // 3 mins ago
    magnitude: 75.2,
    x: -40.1,
    y: 60.5,
    z: 15.0,
    durationMs: 12,
    processed: false,
    severity: 'moderate',
    notes: null,
    createdAt: Date.now(),
  },
];

// --- Sample Sessions ---
const session1Id = 'session_1';
const session2Id = 'session_2';

export const SAMPLE_SESSIONS = [
  {
    id: session1Id,
    name: 'Morning Practice - Soccer',
    startTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    endTime: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
    team: 'Varsity Soccer',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    notes: 'Focused on endurance.',
  },
  {
    id: session2Id,
    name: 'Scrimmage - Football',
    startTime: Date.now() - 26 * 60 * 60 * 1000, // Yesterday
    endTime: Date.now() - 24 * 60 * 60 * 1000, // Yesterday
    team: 'Varsity Football',
    createdAt: Date.now() - 26 * 60 * 60 * 1000,
    notes: 'Full contact scrimmage.',
  }
];

// --- Sample Session Athletes (Link athletes to sessions) ---
export const SAMPLE_SESSION_ATHLETES = [
  { sessionId: session1Id, athleteId: athlete1Id, startTime: Date.now() - 2 * 60 * 60 * 1000, endTime: Date.now() - 1 * 60 * 60 * 1000 },
  { sessionId: session2Id, athleteId: athlete2Id, startTime: Date.now() - 26 * 60 * 60 * 1000, endTime: Date.now() - 24 * 60 * 60 * 1000 },
  // Add more links as needed
];

// --- Sample Calibration Data ---
export const SAMPLE_CALIBRATION_DATA = [
  {
    deviceId: 'mouthguard_A',
    sensorType: 'accelerometer',
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    offsetX: 0.1, offsetY: -0.05, offsetZ: 0.02,
    scaleX: 1.01, scaleY: 0.99, scaleZ: 1.00,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    deviceId: 'mouthguard_B',
    sensorType: 'imu',
    timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
    offsetX: -0.2, offsetY: 0.1, offsetZ: -0.08,
    scaleX: 0.98, scaleY: 1.02, scaleZ: 0.99,
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  }
];

// Function to generate OLD Canova insert statements (REMOVE LATER)
export function getInsertStatements(): string {
    return(`
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 18:28:33', 27050);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 03:31:57', 12228);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 23:51:43', 13319);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 17:23:17', 18857);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 11:04:59', 10164);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 12:15:16', 17533);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 14:02:16', 6253);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 08:19:24', 16822);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 08:59:23', 22545);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 00:18:00', 8259);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 04:04:13', 2611);
`)
}