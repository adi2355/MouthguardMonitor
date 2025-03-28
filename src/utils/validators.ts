import { BongHit, Strain, JournalEntry, SafetyRecord } from '../types';

/**
 * Validators utility
 * 
 * Contains domain-specific validation functions for various data types
 * used throughout the application.
 */

/**
 * Validate a BongHit object
 * @param hit The BongHit to validate
 * @returns Error message if invalid, null if valid
 */
export function validateBongHit(hit: BongHit): string | null {
  if (!hit) return 'Bong hit data is required';
  if (!hit.timestamp) return 'Timestamp is required';
  if (!isValidISOTimestamp(hit.timestamp)) return 'Invalid timestamp format';
  if (typeof hit.duration_ms !== 'number') return 'Duration must be a number';
  if (hit.duration_ms <= 0) return 'Duration must be positive';
  return null; // Valid
}

/**
 * Validate a Strain object
 * @param strain The Strain to validate
 * @returns Error message if invalid, null if valid
 */
export function validateStrain(strain: Strain): string | null {
  if (!strain) return 'Strain data is required';
  if (!strain.name || strain.name.trim() === '') return 'Strain name is required';
  if (!strain.genetic_type) return 'Genetic type is required';
  if (strain.thc_rating != null && (typeof strain.thc_rating !== 'number' || strain.thc_rating < 0 || strain.thc_rating > 100)) {
    return 'THC rating must be a number between 0 and 100';
  }
  return null; // Valid
}

/**
 * Validate a SafetyRecord object
 * @param record The SafetyRecord to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSafetyRecord(record: SafetyRecord): string | null {
  if (!record) return 'Safety record is required';
  if (!record.id) return 'Safety record ID is required';
  if (!record.user_id) return 'User ID is required';
  if (!record.concern_type) return 'Concern type is required';
  if (!record.concern_details || record.concern_details.trim() === '') return 'Concern details are required';
  if (!record.created_at) return 'Created timestamp is required';
  return null; // Valid
}

/**
 * Validate a JournalEntry object
 * @param entry The JournalEntry to validate
 * @returns Error message if invalid, null if valid
 */
export function validateJournalEntry(entry: JournalEntry): string | null {
  if (!entry) return 'Journal entry is required';
  if (!entry.id) return 'Entry ID is required';
  if (!entry.user_id) return 'User ID is required';
  if (!entry.created_at) return 'Created timestamp is required';
  if (!isValidISOTimestamp(entry.created_at)) return 'Invalid timestamp format';
  return null; // Valid
}

/**
 * Check if a string is a valid ISO timestamp
 * @param timestamp The timestamp string to validate
 * @returns Whether the string is a valid ISO timestamp
 */
export function isValidISOTimestamp(timestamp: string): boolean {
  try {
    if (typeof timestamp !== 'string') {
      console.error(`[Validators] Invalid timestamp type: ${typeof timestamp}`);
      return false;
    }
    
    // Check for ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
    // This regex checks for the basic pattern but isn't exhaustive
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(timestamp)) {
      console.error(`[Validators] Timestamp doesn't match ISO format: ${timestamp}`);
      return false;
    }
    
    const date = new Date(timestamp);
    const isValid = !isNaN(date.getTime());
    
    // Extra validation: Check that the timestamp is truly ISO format by ensuring
    // toISOString() produces the exact same string
    const roundTrip = isValid && date.toISOString() === timestamp;
    
    if (!isValid) {
      console.error(`[Validators] Invalid date from timestamp: ${timestamp}`);
    } else if (!roundTrip) {
      console.error(`[Validators] Timestamp not in canonical ISO format. Original: ${timestamp}, Parsed: ${date.toISOString()}`);
    }
    
    return isValid && roundTrip;
  } catch (error) {
    console.error(`[Validators] Error validating timestamp: ${error}`);
    return false;
  }
}

/**
 * Validate that a value is not empty (null, undefined, or empty string)
 * @param value The value to validate
 * @param fieldName The name of the field for the error message
 * @throws Error if the value is empty
 */
export function validateNotEmpty(value: any, fieldName: string): void {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} is required and cannot be empty`);
  }
}

/**
 * Create a validation error result
 * @param code Error code
 * @param message Error message
 * @param data Optional data related to the error
 * @returns Validation error result object
 */
export function createValidationError<T>(code: string, message: string, data?: any): { 
  success: false, 
  error: string, 
  code: string, 
  data?: any 
} {
  return {
    success: false,
    error: message,
    code,
    data
  };
}

/**
 * Create a successful validation result
 * @param data The validated data
 * @returns Successful validation result object
 */
export function createValidationSuccess<T>(data: T): {
  success: true,
  data: T
} {
  return {
    success: true,
    data
  };
}

/**
 * Validation result type
 */
export type ValidationResult<T> = 
  | { success: true, data: T }
  | { success: false, error: string, code: string, data?: any }; 