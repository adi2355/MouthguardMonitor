import { SQLiteDatabase } from 'expo-sqlite';
import { dataChangeEmitter, dbEvents } from '../utils/EventEmitter';
import { MotionPacket, FSRPacket, HRMPacket, HTMPacket, ImpactEvent, AccelerometerData, TemperatureData, HeartRateData } from '../types';

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
    z: number,
    sessionId: string | null = null
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO imu_data (device_id, sensor_id, timestamp, x, y, z, created_at, session_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [deviceId, sensorId, timestamp, x, y, z, now, sessionId]
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
    data: AccelerometerData & { sessionId?: string | null }
  ): Promise<void> {
    const now = Date.now();
    const thresholdG = 80; // Example threshold

    // Use a transaction if inserting into multiple tables conditionally
    await this.db.withTransactionAsync(async () => {
      try {
        await this.db.runAsync(
          `INSERT INTO accelerometer_data (device_id, sensor_id, timestamp, x, y, z, magnitude, created_at, session_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [data.deviceId, data.sensorId, data.timestamp, data.x, data.y, data.z, data.magnitude, data.createdAt || now, data.sessionId || null]
        );

        // Check if this is a potential concussion event (high-g impact)
        if (data.magnitude > thresholdG) {
          await this.recordImpactEventInternal(
            data.deviceId, undefined, data.timestamp, 
            data.magnitude, data.x, data.y, data.z, 
            data.createdAt || now, undefined, undefined, undefined, undefined,
            data.sessionId || null
          ); // Use internal helper
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
    data: TemperatureData & { sessionId?: string | null }
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO temperature_data (device_id, sensor_id, timestamp, temperature, created_at, session_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.deviceId, data.sensorId, data.timestamp, data.temperature, data.createdAt || now, data.sessionId || null]
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
    force: number,
    sessionId: string | null = null
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO force_data (device_id, sensor_id, timestamp, force, created_at, session_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [deviceId, sensorId, timestamp, force, now, sessionId]
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
    data: HeartRateData & { sessionId?: string | null }
  ): Promise<void> {
    const now = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO heart_rate_data (device_id, timestamp, heart_rate, created_at, session_id)
         VALUES (?, ?, ?, ?, ?)`,
        [data.deviceId, data.timestamp, data.heartRate, data.createdAt || now, data.sessionId || null]
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
    notes?: string,
    sessionId: string | null = null
  ): Promise<void> {
    console.warn(`SensorDataRepository: Recording potential impact event: ${magnitude.toFixed(1)}g`);
    await this.db.runAsync(
      `INSERT INTO impact_events (device_id, athlete_id, timestamp, magnitude, x, y, z, duration_ms, location, processed, severity, notes, created_at, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        createdAt,
        sessionId
      ]
    );
    // Emit concussion detected event
    dataChangeEmitter.emit(dbEvents.CONCUSSION_DETECTED, {
      deviceId,
      timestamp,
      magnitude,
      athleteId, // Pass athleteId if available
      sessionId // Pass sessionId if available
    });
  }

  /**
   * Record a raw Motion Packet and potentially an impact event
   */
  public async recordMotionPacket(deviceId: string, packet: MotionPacket, sessionId: string | null = null): Promise<number> {
    const appTimestamp = Date.now();
    console.log(`[SensorDataRepo] Recording Motion Packet for ${deviceId} at ${appTimestamp}, device timestamp: ${packet.timestamp}, sessionId: ${sessionId || 'none'}`);

    try {
      // Calculate G-forces for impact detection
      const SENSITIVITY_200G = 16384 / 200; // Example conversion factor - adjust based on actual sensor
      const gForceX = packet.accel200[0] / SENSITIVITY_200G;
      const gForceY = packet.accel200[1] / SENSITIVITY_200G;
      const gForceZ = packet.accel200[2] / SENSITIVITY_200G;
      const magnitude = Math.sqrt(gForceX**2 + gForceY**2 + gForceZ**2);

      // Insert the raw packet data
      const result = await this.db.runAsync(
        `INSERT INTO motion_packets (
          device_id, device_timestamp,
          gyro_x, gyro_y, gyro_z,
          accel16_x, accel16_y, accel16_z,
          accel200_x, accel200_y, accel200_z,
          mag_x, mag_y, mag_z,
          bite_l, bite_r, app_timestamp, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deviceId,
          packet.timestamp,
          packet.gyro[0], packet.gyro[1], packet.gyro[2],
          packet.accel16[0], packet.accel16[1], packet.accel16[2],
          packet.accel200[0], packet.accel200[1], packet.accel200[2], 
          packet.mag[0], packet.mag[1], packet.mag[2],
          packet.bite_l, packet.bite_r,
          appTimestamp,
          sessionId
        ]
      );

      // Check if this is a potential impact event
      const IMPACT_THRESHOLD_G = 80; // Example threshold
      if (magnitude > IMPACT_THRESHOLD_G) {
        // Create an impact event
        await this.recordImpactEventInternal(
          deviceId,
          undefined, // athleteId (could look this up from device)
          appTimestamp, // use app timestamp for consistent timeline
          magnitude,
          gForceX, gForceY, gForceZ,
          appTimestamp,
          undefined, undefined, undefined, undefined,
          sessionId
        );
      }

      // Return the inserted ID
      dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'motion', deviceId, sessionId });
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting motion packet:', error);
      throw error;
    }
  }

  /**
   * Record a raw FSR Packet
   */
  public async recordFSRPacket(deviceId: string, packet: FSRPacket, sessionId: string | null = null): Promise<number> {
    const appTimestamp = Date.now();
    console.log(`[SensorDataRepo] Recording FSR Packet for ${deviceId} at ${appTimestamp}, device timestamp: ${packet.timestamp}, sessionId: ${sessionId || 'none'}`);

    try {
      const result = await this.db.runAsync(
        `INSERT INTO fsr_packets (
          device_id, device_timestamp,
          left_bite, right_bite, app_timestamp, session_id
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          deviceId, 
          packet.timestamp, 
          packet.left_bite, 
          packet.right_bite, 
          appTimestamp,
          sessionId
        ]
      );

      dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'fsr', deviceId, sessionId });
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting FSR packet:', error);
      throw error;
    }
  }

  /**
   * Record a raw HRM Packet
   */
  public async recordHRMPacket(deviceId: string, packet: HRMPacket, sessionId: string | null = null): Promise<number> {
    const appTimestamp = packet.appTimestamp || Date.now();
    console.log(`[SensorDataRepo] Recording HRM Packet for ${deviceId} at ${appTimestamp}, sessionId: ${sessionId || 'none'}`);

    try {
      const result = await this.db.runAsync(
        `INSERT INTO hrm_packets (
          device_id, flags, heart_rate, app_timestamp, session_id
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          deviceId,
          packet.flags,
          packet.heartRate,
          appTimestamp,
          sessionId
        ]
      );

      dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'hrm', deviceId, sessionId });
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting HRM packet:', error);
      throw error;
    }
  }

  /**
   * Record a raw HTM Packet
   */
  public async recordHTMPacket(deviceId: string, packet: HTMPacket, sessionId: string | null = null): Promise<number> {
    const appTimestamp = packet.appTimestamp || Date.now();
    console.log(`[SensorDataRepo] Recording HTM Packet for ${deviceId} at ${appTimestamp}, sessionId: ${sessionId || 'none'}`);

    try {
      const result = await this.db.runAsync(
        `INSERT INTO htm_packets (
          device_id, flags, temperature, type, app_timestamp, session_id
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          deviceId,
          packet.flags,
          packet.temperature,
          packet.type || null,
          appTimestamp,
          sessionId
        ]
      );

      dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'htm', deviceId, sessionId });
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting HTM packet:', error);
      throw error;
    }
  }

  /**
   * Get sensor data with optional session filtering
   */
  public async getSensorData(
    deviceId: string,
    sensorType: 'motion_packets' | 'fsr_packets' | 'hrm_packets' | 'htm_packets' | 'impact_events',
    options: { 
      startTime?: number;
      endTime?: number;
      sessionId?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    const { startTime, endTime, sessionId, limit = 1000 } = options;
    const timestampField = sensorType === 'impact_events' ? 'timestamp' : 'app_timestamp';
    
    const params: any[] = [deviceId];
    let query = `SELECT * FROM ${sensorType} WHERE device_id = ?`;
    
    // Add session filter if provided
    if (sessionId) {
      query += ` AND session_id = ?`;
      params.push(sessionId);
    }
    
    // Add time range filter if provided
    if (startTime !== undefined && endTime !== undefined) {
      query += ` AND ${timestampField} BETWEEN ? AND ?`;
      params.push(startTime, endTime);
    }
    
    query += ` ORDER BY ${timestampField} ASC LIMIT ?`;
    params.push(limit);
    
    console.log(`[SensorDataRepo] Executing query: ${query} with params:`, params);
    
    try {
      const result = await this.db.getAllAsync(query, params);
      console.log(`[SensorDataRepo] Retrieved ${result?.length || 0} ${sensorType} records`);
      return result || [];
    } catch (error) {
      console.error(`Error retrieving ${sensorType} data:`, error);
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

  /**
   * Record an impact event
   */
  public async recordImpactEvent(
    event: Omit<ImpactEvent, 'id' | 'processed'> // Expect an object
  ): Promise<number> { // Return the inserted ID
    console.warn(`SensorDataRepository: Recording potential impact event: ${event.magnitude.toFixed(1)}g`);
    const result = await this.db.runAsync(
      `INSERT INTO impact_events (device_id, athlete_id, timestamp, magnitude, x, y, z, duration_ms, location, processed, severity, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.deviceId,
        event.athleteId ?? null,
        event.createdAt, // Use createdAt (app timestamp) for the main timestamp column
        event.magnitude,
        event.x, event.y, event.z,
        event.durationMs ?? null,
        event.location ?? null,
        0, // processed = false
        event.severity ?? null,
        event.notes ?? null,
        event.createdAt // Also store in created_at
      ]
    );
    // Emit concussion detected event
    dataChangeEmitter.emit(dbEvents.CONCUSSION_DETECTED, {
      deviceId: event.deviceId,
      timestamp: event.timestamp,
      magnitude: event.magnitude,
      athleteId: event.athleteId // Pass athleteId if available
    });
    return result.lastInsertRowId; // Return the ID
  }
} 