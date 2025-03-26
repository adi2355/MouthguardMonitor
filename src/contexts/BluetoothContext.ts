import { createContext } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import base64 from "react-native-base64";
import { insertBongHitIntoDatabase } from "../database/expoSqliteManager";
import { parseRawTimestamp } from "../utils/functions";

type ConnectedDevice = {
    device: Device;
    serviceUUID: string;
    characteristicUUID: string
}

export class BluetoothHandler {
    private manager: BleManager;
    private connectedDevice: ConnectedDevice | null;

    constructor() {
        this.manager = new BleManager();
        this.connectedDevice = null;
    }

    public async connectToDevice(deviceId: string) {
        if (this.connectedDevice !== null) {
            // If we already have a connected device, we should:
            // 1. Check if it's the same device - if so, just return
            // 2. If it's a different device, disconnect from the current one first
            if (this.connectedDevice.device.id === deviceId) {
                console.log("Already connected to this device");
                return;
            }
            
            console.log("Disconnecting from current device before connecting to new one");
            this.disconnectFromDevice(this.connectedDevice.device);
            this.connectedDevice = null;
        }
        
        try {
            const deviceConnection: Device = await this.manager.connectToDevice(deviceId);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            const services = await deviceConnection.services();
            if (services.length !== 1) {
                throw Error("Bad number of services");
            }

            const service = services[0];
            const characteristics = await service.characteristics();
            if (characteristics.length !== 1) {
                throw Error("Bad number of characteristics");
            }
            const characteristic = characteristics[0];
            this.connectedDevice = {
                device: deviceConnection,
                serviceUUID: service.uuid,
                characteristicUUID: characteristic.uuid
            }

        } catch (error) {
            console.error('Error discovering services/characteristics:', error);
            throw error; // Re-throw to allow caller to handle the error
        } finally {
            this.manager.stopDeviceScan();
        }
    }

    public disconnectFromDevice(connectedDevice: Device) {
        if (connectedDevice) {
            this.manager.cancelDeviceConnection(connectedDevice.id);
            if (this.connectedDevice?.device.id === connectedDevice.id) {
                this.connectedDevice = null;
            }
        }
    }

    /*
     * This function starts listening for data on the connected device
     */
    public streamOnConnectedDevice() {
        if (this.connectedDevice === null) {
            throw Error("Tried to stream with no device connected");
        } 
        
        // Sync data
        this.sendCurrentTimestamp()
        this.connectedDevice.device.monitorCharacteristicForService(
            this.connectedDevice.serviceUUID,
            this.connectedDevice.characteristicUUID,
            this.handleBluetoothConnection
        );
    }



    /* 
     * This function encapsulates all logic relating to listening to on the bluetooth conneciton
     */
    private handleBluetoothConnection(error: BleError | null, characteristic: Characteristic | null) {
        if (error) {
          console.log("Stream error:", error);
          return -1;
        } else if (!characteristic?.value) {
          console.log("No data was received");
          return -1;
        }

        const rawData: string[] = base64.decode(characteristic.value).split(';');
        const rawTimestamp: string = rawData[0]; //Tuesday, March 25 2025 21:40:12
        const duration: number = parseFloat(rawData[1])*100000; // 0.17
        const timestamp: string  = parseRawTimestamp(rawTimestamp);
        insertBongHitIntoDatabase(timestamp, duration);
        Alert.alert(`Timestamp: ${rawTimestamp}\n Duration: ${duration}ms`);
    }

    /*
     * This function generates the current timestamp which will be used to sync the Trak+ to an accurate timestamp on connection.
     */
    private async sendCurrentTimestamp() {
        if (!this.connectedDevice) {
            throw new Error("Tried to send timestamp to device, but connection not found");
        }
        try {
            const timestamp = Math.floor(Date.now() / 1000); // Seconds, not milliseconds
            const gmtOffset = new Date().getTimezoneOffset() * 60;  // Offset in seconds (e.g., GMT-5 -> -18000)
            const base64Timestamp = base64.encode( `${timestamp},${gmtOffset}`)

            // Write data to the characteristic
            await this.manager.writeCharacteristicWithResponseForDevice(
              this.connectedDevice.device.id,
              this.connectedDevice.serviceUUID,
              this.connectedDevice.characteristicUUID,
              base64Timestamp
            );
      
            console.log(`Sent: Timestamp ${timestamp}, GMT Offset ${gmtOffset}`);
            return true;
          } catch (error) {
            console.error('Error sending data:', error);
            return false;
          }
    }


    public getBLEManager(): BleManager {
        return this.manager;
    }

    public getConnectedDevice(): Device | undefined {
        return this.connectedDevice?.device;
    }

    /*
     * Requests bluetooth permissions, accounting for platform differences
     */
    private async requestPermissions() {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                // Android version below 31
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Bluetooth Low Energy requires Location",
                        buttonPositive: "OK",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                // Android version above 31
                const isAndroid31PermissionsGranted = await this.requestAndroid31Permissions();

                return isAndroid31PermissionsGranted;
            }
        } else {
            //ios
            return true;
        }
    }

    private async requestAndroid31Permissions() {
        const bluetoothScanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );
        const fineLocationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );

        return (
            bluetoothScanPermission === "granted" &&
            bluetoothConnectPermission === "granted" &&
            fineLocationPermission === "granted"
        );
    }
}

export const BluetoothContext = createContext<BluetoothHandler | undefined>(undefined);
