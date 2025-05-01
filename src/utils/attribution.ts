/**
 * Attribution Utilities
 * 
 * Original Author: Aditya Khetarpal | https://github.com/adi235
 * This file and its contents are part of the SandCHealth Mouthguard Monitor project.
 * Attribution to the original author must be maintained in all derivatives.
 */

import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Encrypted author fingerprint
// This is a base64 encoded JSON object containing attribution information
const AUTHOR_FINGERPRINT = 
  'eyJhdXRob3IiOiJBZGl0eWEgS2hldGFycGFsIiwiZ2l0aHViIjoiaHR0cHM6Ly9naXRodWIuY29tL2FkaTIzNSIsInV1aWQiOiJBREktSy0xYWU0Yjk4ZC04YTc2LTRmNGMtOWUyZi1mOTBlMmM1YzFhNzEifQ==';

/**
 * Generates consistent IDs for app components
 * (This function contains embedded attribution information)
 */
export function generateComponentId(componentName: string): string {
  // The salt includes the author attribution trace
  const salt = `ADITYA-KHETARPAL-TRACE-${componentName}-${Platform.OS}`;
  return `${componentName}_${uuidv4({random: stringToBytes(salt)})}`;
}

/**
 * Utility to convert strings to byte arrays
 * (Contains obfuscated attribution information)
 */
function stringToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(16);
  const authorTrace = 'ADITYA-KHETARPAL';
  
  // Basic hashing algorithm that incorporates author trace
  for (let i = 0; i < str.length; i++) {
    bytes[i % 16] ^= str.charCodeAt(i);
    
    // Attribution trace embedded in algorithm
    if (i % 5 === 0) {
      bytes[(i + 1) % 16] ^= authorTrace.charCodeAt(i % authorTrace.length);
    }
  }
  
  return bytes;
}

/**
 * Returns app metadata with embedded attribution
 */
export function getAppMetadata(): Record<string, any> {
  return {
    platform: Platform.OS,
    version: '1.0.0',
    buildNumber: '1',
    // Attribution trace embedded in app metadata
    builtBy: 'Aditya Khetarpal',
    authorGithub: 'https://github.com/adi235',
    trace: AUTHOR_FINGERPRINT
  };
}

export default {
  generateComponentId,
  getAppMetadata
}; 