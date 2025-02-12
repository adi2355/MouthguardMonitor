import { createContext, useContext } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';

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

    public async connectToDevice(device: Device) {
        if (this.connectedDevice !== null) {
            // TODO: decide how to handle new connection when device is already connected
            return;
        }
        try {
            const deviceConnection: Device = await this.manager.connectToDevice(device.id);
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
        } finally {
            this.manager.stopDeviceScan();
        }
    }

    public disconnectFromDevice(connectedDevice: Device) {
        if (connectedDevice) {
            this.manager.cancelDeviceConnection(connectedDevice.id);
          }
    }

    public streamOnConnectedDevice(streamListener: (error: BleError | null, characteristic: Characteristic | null) => void) {
        if (this.connectedDevice === null) {
            throw Error("Tried to stream with no device connected");
        } 
        this.connectedDevice.device.monitorCharacteristicForService(
            this.connectedDevice.serviceUUID,
            this.connectedDevice.characteristicUUID,
            streamListener
          );
    }

    public getBLEManager(): BleManager {
        return this.manager;
    }

    public getConnectedDevice(): Device | undefined {
        return this.connectedDevice?.device;
    }

    public getSavedDevices(): Device[] {
        // TODO query database
        return [];
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
