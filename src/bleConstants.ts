// BLE UUID Constants matching Arduino code

// Service UUIDs
export const UUID_SERVICE_HRM = "a329162e-bf3d-4f73-9a1a-bb8ccfe142e7";
export const UUID_SERVICE_HTM = "d2a95330-d754-4a5b-bb74-b1b09bef98f5";
export const UUID_SERVICE_IMU = "5f07ce79-170a-4c45-b8ca-eae29004e45f";
export const UUID_SERVICE_FSR = "56f38df0-e65b-4190-a3da-9f941c9d1763";

// Characteristic UUIDs
export const UUID_CHARACTERISTIC_HRMC = "0a21fc6f-6edb-4086-9460-0eccb35150fb"; // HRM Data
export const UUID_CHARACTERISTIC_HTMC = "6896072b-24ce-4982-ac6a-899fa7183069"; // HTM Data
export const UUID_CHARACTERISTIC_IMUC = "d2e9a9c2-a94b-42cb-b11d-b76549e7a164"; // IMU Data
export const UUID_CHARACTERISTIC_BITE_FORCE = "f86a2066-5203-4bed-b090-ac0b89e68d81"; // FSR Data

// Standard service/characteristic UUIDs
export const UUID_SERVICE_BATTERY = "180f"; // Standard Battery Service
export const UUID_CHARACTERISTIC_BATTERY_LEVEL = "2a19"; // Standard Battery Level

// Group for easier access
export const MOUTHGUARD_UUIDS = {
  services: {
    hrm: UUID_SERVICE_HRM,
    htm: UUID_SERVICE_HTM,
    imu: UUID_SERVICE_IMU,
    fsr: UUID_SERVICE_FSR,
    battery: UUID_SERVICE_BATTERY,
  },
  characteristics: {
    hrmData: UUID_CHARACTERISTIC_HRMC,
    htmData: UUID_CHARACTERISTIC_HTMC,
    imuData: UUID_CHARACTERISTIC_IMUC,
    fsrData: UUID_CHARACTERISTIC_BITE_FORCE,
    batteryLevel: UUID_CHARACTERISTIC_BATTERY_LEVEL,
  }
}; 