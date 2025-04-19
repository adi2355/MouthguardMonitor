import { SQLiteDatabase } from 'expo-sqlite';
import { dataChangeEmitter, dbEvents } from '../utils/EventEmitter';
import { MotionPacket, FSRPacket, HRMPacket, HTMPacket, ImpactEvent } from '../types';

/**
 * Repository for managing sensor data from mouthguard devices
 */
export class SensorDataRepository {
  private db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  /**
   * Record IMU data from a device
   */
  public async recordImuData(
    deviceId: string,
    sensorId: number,
    timestamp: number,
    x: number,
    y: number,
    z: number
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO imu_data (device_id, sensor_id, timestamp, x, y, z, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [deviceId, sensorId, timestamp, x, y, z, now]
      );
    } catch (error) {
      console.error('Error inserting IMU data:', error);
      throw error;
    }
  }

  /**
   * Record accelerometer data from a device
   */
  public async recordAccelerometerData(
    deviceId: string,
    sensorId: number,
    timestamp: number,
    x: number,
    y: number,
    z: number,
    magnitude: number
  ): Promise<void> {
    const now = Date.now();
    const thresholdG = 80; // Example threshold

    // Use a transaction if inserting into multiple tables conditionally
    await this.db.withTransactionAsync(async () => {
      try {
        await this.db.runAsync(
          `INSERT INTO accelerometer_data (device_id, sensor_id, timestamp, x, y, z, magnitude, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [deviceId, sensorId, timestamp, x, y, z, magnitude, now]
        );

        // Check if this is a potential concussion event (high-g impact)
        if (magnitude > thresholdG) {
          await this.recordImpactEventInternal(deviceId, undefined, timestamp, magnitude, x, y, z, now); // Use internal helper
        }
      } catch (error) {
        console.error('Error inserting accelerometer data or impact event:', error);
        throw error; // Re-throw to ensure transaction rollback
      }
    });
  }

  /**
   * Record temperature data from a device
   */
  public async recordTemperatureData(
    deviceId: string,
    sensorId: number,
    timestamp: number,
    temperature: number
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO temperature_data (device_id, sensor_id, timestamp, temperature, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [deviceId, sensorId, timestamp, temperature, now]
      );
    } catch (error) {
      console.error('Error inserting temperature data:', error);
      throw error;
    }
  }

  /**
   * Record force sensor data from a device
   */
  public async recordForceData(
    deviceId: string,
    sensorId: number,
    timestamp: number,
    force: number
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO force_data (device_id, sensor_id, timestamp, force, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [deviceId, sensorId, timestamp, force, now]
      );
    } catch (error) {
      console.error('Error inserting force data:', error);
      throw error;
    }
  }

  /**
   * Record heart rate data from a device
   */
  public async recordHeartRateData(
    deviceId: string,
    timestamp: number,
    heartRate: number
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO heart_rate_data (device_id, timestamp, heart_rate, created_at)
         VALUES (?, ?, ?, ?)`,
        [deviceId, timestamp, heartRate, now]
      );
    } catch (error) {
      console.error('Error inserting heart rate data:', error);
      throw error;
    }
  }

  /**
   * Internal helper to record an impact event (used by other methods)
   */
  private async recordImpactEventInternal(
    deviceId: string,
    athleteId: string | undefined,
    timestamp: number,
    magnitude: number,
    x: number,
    y: number,
    z: number,
    createdAt: number,
    severity?: string,
    durationMs?: number,
    location?: string,
    notes?: string
  ): Promise<void> {
    console.warn(`SensorDataRepository: Recording potential impact event: ${magnitude.toFixed(1)}g`);
    await this.db.runAsync(
      `INSERT INTO impact_events (device_id, athlete_id, timestamp, magnitude, x, y, z, duration_ms, location, processed, severity, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deviceId,
        athleteId ?? null,
        timestamp,
        magnitude,
        x, y, z,
        durationMs ?? null,
        location ?? null,
        0, // processed = false
        severity ?? null,
        notes ?? null,
        createdAt
      ]
    );
    // Emit concussion detected event
    dataChangeEmitter.emit(dbEvents.CONCUSSION_DETECTED, {
      deviceId,
      timestamp,
      magnitude,
      athleteId // Pass athleteId if available
    });
  }

  /**
   * Record a raw Motion Packet and potentially an impact event
   */
  public async recordMotionPacket(deviceId: string, packet: MotionPacket): Promise<number> {
    const appTimestamp = Date.now();
    console.log(`[SensorDataRepo] Recording Motion Packet for ${deviceId} at ${appTimestamp}, device timestamp: ${packet.timestamp}`);

    // **Decision Point:** Are accel16 or accel200 the primary source for impact detection?
    // Let's assume accel200 is the high-G sensor for impacts.
    const highGAccel = packet.accel200;
    const thresholdG = 80; // Example threshold

    // You'll need to convert raw accel200 values to Gs based on sensor sensitivity
    // Placeholder conversion - REPLACE WITH ACTUAL CALCULATION
    const SENSITIVITY_200G = 16384 / 200; // Example: If 16-bit covers +/- 200g range (adjust!)
    const gForceX = highGAccel[0] / SENSITIVITY_200G;
    const gForceY = highGAccel[1] / SENSITIVITY_200G;
    const gForceZ = highGAccel[2] / SENSITIVITY_200G;
    const magnitude = Math.sqrt(gForceX**2 + gForceY**2 + gForceZ**2);

    let insertedId = -1;
    await this.db.withTransactionAsync(async () => {
      try {
        const result = await this.db.runAsync(
          `INSERT INTO motion_packets (
            device_id, device_timestamp,
            gyro_x, gyro_y, gyro_z,
            accel16_x, accel16_y, accel16_z,
            accel200_x, accel200_y, accel200_z,
            mag_x, mag_y, mag_z,
            bite_l, bite_r, app_timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            deviceId, packet.timestamp, // No longer dividing by 1000 - using milliseconds directly
            packet.gyro[0], packet.gyro[1], packet.gyro[2],
            packet.accel16[0], packet.accel16[1], packet.accel16[2],
            packet.accel200[0], packet.accel200[1], packet.accel200[2], // Store raw 200g values
            packet.mag[0], packet.mag[1], packet.mag[2],
            packet.bite_l, packet.bite_r, appTimestamp
          ]
        );

        insertedId = result.lastInsertRowId;

        // If magnitude exceeds threshold, record an impact event using calculated Gs
        if (magnitude > thresholdG) {
          // Determine severity based on calculated magnitude
          const severity =
            magnitude > 120 ? 'critical' :
            magnitude > 100 ? 'severe' :
            magnitude > 80 ? 'moderate' : 'low'; // Severity based on G-force

          // TODO: Get athleteId associated with deviceId if possible
          const athleteId = undefined; // Placeholder

          await this.recordImpactEventInternal(
            deviceId,
            athleteId,
            packet.timestamp, // Using milliseconds directly
            magnitude, // Calculated magnitude
            gForceX, gForceY, gForceZ, // Calculated G-forces
            appTimestamp, // When recorded by app
            severity
            // Add durationMs, location, notes if available/calculable
          );
        }

        console.log(`[SensorDataRepo] Motion Packet recorded, ID: ${result.lastInsertRowId}`);
        dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'motion', deviceId });
      } catch (error) {
        console.error('[SensorDataRepo] Error inserting Motion Packet or Impact Event:', error);
        throw error; // Re-throw to ensure transaction rollback
      }
    });

    return insertedId;
  }

  /**
   * Record a raw FSR Packet
   */
  public async recordFSRPacket(deviceId: string, packet: FSRPacket): Promise<number> {
    const appTimestamp = Date.now();
    console.log(`[SensorDataRepo] Recording FSR Packet for ${deviceId} at ${appTimestamp}, device timestamp: ${packet.timestamp}`);
    try {
      const result = await this.db.runAsync(
        `INSERT INTO fsr_packets (
          device_id, device_timestamp, left_bite, right_bite, app_timestamp
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          deviceId, packet.timestamp, // No longer dividing by 1000 - using milliseconds directly
          packet.left_bite, packet.right_bite, appTimestamp
        ]
      );
      console.log(`[SensorDataRepo] FSR Packet recorded, ID: ${result.lastInsertRowId}`);
      dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'fsr', deviceId });
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[SensorDataRepo] Error inserting FSR Packet:', error);
      throw error;
    }
  }

  /**
   * Record a raw HRM Packet
   */
  public async recordHRMPacket(deviceId: string, packet: HRMPacket): Promise<number> {
    const appTimestamp = packet.appTimestamp || Date.now(); // Use provided or current time
    console.log(`[SensorDataRepo] Recording HRM Packet for ${deviceId} at ${appTimestamp}`);
    try {
      const result = await this.db.runAsync(
        `INSERT INTO hrm_packets (
          device_id, flags, heart_rate, app_timestamp
        ) VALUES (?, ?, ?, ?)`,
        [
          deviceId, packet.flags, packet.heartRate, appTimestamp
        ]
      );
      console.log(`[SensorDataRepo] HRM Packet recorded, ID: ${result.lastInsertRowId}`);
      dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'hrm', deviceId });
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[SensorDataRepo] Error inserting HRM Packet:', error);
      throw error;
    }
  }

  /**
   * Record a raw HTM Packet
   */
  public async recordHTMPacket(deviceId: string, packet: HTMPacket): Promise<number> {
    const appTimestamp = packet.appTimestamp || Date.now(); // Use provided or current time
    console.log(`[SensorDataRepo] Recording HTM Packet for ${deviceId} at ${appTimestamp}`);
    try {
      const result = await this.db.runAsync(
        `INSERT INTO htm_packets (
          device_id, flags, temperature, type, app_timestamp
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          deviceId, packet.flags, packet.temperature, packet.type ?? null, appTimestamp
        ]
      );
      console.log(`[SensorDataRepo] HTM Packet recorded, ID: ${result.lastInsertRowId}`);
      dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'htm', deviceId });
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[SensorDataRepo] Error inserting HTM Packet:', error);
      throw error;
    }
  }

  /**
   * Get sensor data for a specific device within a time range
   */
  public async getSensorData(
    deviceId: string,
    sensorType: 'motion_packets' | 'fsr_packets' | 'hrm_packets' | 'htm_packets' | 'impact_events',
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    const startSeconds = Math.floor(startTime / 1000);
    const endSeconds = Math.floor(endTime / 1000);

    let query: string;
    let timestampField = 'app_timestamp'; // Default to app timestamp

    if (sensorType === 'motion_packets' || sensorType === 'fsr_packets') {
      timestampField = 'device_timestamp'; // Use device timestamp for these
      query = `SELECT * FROM ${sensorType}
               WHERE device_id = ? AND device_timestamp BETWEEN ? AND ?
               ORDER BY device_timestamp ASC`;
    } else if (sensorType === 'impact_events') {
      timestampField = 'timestamp'; // Impact events use 'timestamp' field
      query = `SELECT * FROM ${sensorType}
               WHERE device_id = ? AND timestamp BETWEEN ? AND ?
               ORDER BY timestamp ASC`;
    } else { // hrm_packets, htm_packets use app_timestamp
      query = `SELECT * FROM ${sensorType}
               WHERE device_id = ? AND app_timestamp BETWEEN ? AND ?
               ORDER BY app_timestamp ASC`;
    }

    try {
      const results = await this.db.getAllAsync(query, [deviceId, startTime, endTime]); // Use original ms timestamps for query
      return results ?? []; // Return empty array if results are null/undefined
    } catch (error) {
      console.error(`Error querying ${sensorType} data:`, error);
      throw error;
    }
  }

  /**
   * Get concussion events for a specific device
   */
  public async getConcussionEvents(deviceId: string): Promise<ImpactEvent[]> {
    try {
      const results = await this.db.getAllAsync<ImpactEvent>(
        `SELECT * FROM impact_events
         WHERE device_id = ?
         ORDER BY timestamp DESC`,
        [deviceId]
      );
      return results ?? [];
    } catch (error) {
      console.error('Error querying concussion events:', error);
      throw error;
    }
  }

  /**
   * Update concussion event with notes and processed status
   */
  public async updateConcussionEvent(
    id: number,
    notes: string,
    processed: boolean
  ): Promise<void> {
    try {
      await this.db.runAsync(
        `UPDATE impact_events
         SET notes = ?, processed = ?
         WHERE id = ?`,
        [notes, processed ? 1 : 0, id]
      );
    } catch (error) {
      console.error('Error updating concussion event:', error);
      throw error;
    }
  }

  /**
   * Get the most recent data for a specific device
   */
  public async getLatestPacketData(deviceId: string): Promise<any> {
    const result: any = {};
    try {
      const motion = await this.db.getFirstAsync<MotionPacket>(
        `SELECT * FROM motion_packets WHERE device_id = ? ORDER BY app_timestamp DESC LIMIT 1`,
        [deviceId]
      );
      result.motion = motion;

      const fsr = await this.db.getFirstAsync<FSRPacket>(
        `SELECT * FROM fsr_packets WHERE device_id = ? ORDER BY app_timestamp DESC LIMIT 1`,
        [deviceId]
      );
      result.fsr = fsr;

      const hrm = await this.db.getFirstAsync<HRMPacket>(
        `SELECT * FROM hrm_packets WHERE device_id = ? ORDER BY app_timestamp DESC LIMIT 1`,
        [deviceId]
      );
      result.hrm = hrm;

      const htm = await this.db.getFirstAsync<HTMPacket>(
        `SELECT * FROM htm_packets WHERE device_id = ? ORDER BY app_timestamp DESC LIMIT 1`,
        [deviceId]
      );
      result.htm = htm;

      return result;
    } catch (error) {
      console.error('Error querying latest packet data:', error);
      throw error;
    }
  }

  /**
   * Clean up old data to manage database size
   * Keeps only the last 7 days of packet data. Keeps impact events indefinitely.
   */
  public async cleanupOldData(): Promise<void> {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // Milliseconds

    await this.db.withTransactionAsync(async () => {
      try {
        // Don't delete impact_events
        console.log(`[SensorDataRepo] Cleaning up data older than ${new Date(sevenDaysAgo).toISOString()}`);

        const tablesToClean = ['motion_packets', 'fsr_packets', 'hrm_packets', 'htm_packets'];
        // Also clean older *parsed* tables if you keep them
        // const tablesToClean = ['motion_packets', 'fsr_packets', 'hrm_packets', 'htm_packets', 'imu_data', 'accelerometer_data', 'temperature_data', 'force_data', 'heart_rate_data'];

        for (const table of tablesToClean) {
          const timestampField = (table === 'motion_packets' || table === 'fsr_packets') ? 'device_timestamp' : 'app_timestamp';
          // Adjust query based on whether timestamp is seconds or milliseconds
          const timestampCondition = timestampField === 'device_timestamp'
            ? `WHERE ${timestampField} < ?` // Assuming device_timestamp is seconds
            : `WHERE ${timestampField} < ?`; // Assuming app_timestamp is milliseconds

          const timestampValue = timestampField === 'device_timestamp'
            ? Math.floor(sevenDaysAgo / 1000)
            : sevenDaysAgo;

          const result = await this.db.runAsync(
            `DELETE FROM ${table} ${timestampCondition}`,
            [timestampValue]
          );
          console.log(`[SensorDataRepo] Deleted ${result.changes} old records from ${table}`);
        }
      } catch (error) {
        console.error('Transaction error cleaning up old data:', error);
        throw error; // Ensure transaction rollback
      }
    });
  }
} 