const monthStringToInt: { [key: string]: string } = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12",
};

/**
 * Parses raw timestamp from device into a standard ISO format
 * @param rawTimestamp Raw timestamp string from device (e.g., "Thursday, March 27 2025 23:19:34")
 * @returns ISO 8601 formatted timestamp string (e.g., "2025-03-27T23:19:34.000Z")
 */
export function parseRawTimestamp(rawTimestamp: string): string {
    try {
        // Remove day, then separate by spaces
        const parts: string[] = rawTimestamp.split(',')[1].trim().split(' ');
        
        if (parts.length < 4) {
            console.error('Invalid timestamp format received:', rawTimestamp);
            throw new Error('Invalid timestamp parts');
        }
        
        const monthStr: string = parts[0];
        const day: string = parts[1].padStart(2, '0');
        const year: string = parts[2];
        const time: string = parts[3];
        
        // Get month number and pad with zero if needed
        const monthNum = monthStringToInt[monthStr];
        if (!monthNum) {
            console.error(`Unknown month: ${monthStr}`);
            throw new Error('Unknown month');
        }
        const month: string = monthNum;
        
        // Create a Date object from the local time
        // This correctly parses as local time, not UTC
        const localDate = new Date(`${year}-${month}-${day}T${time}`);
        
        // Check if the date is valid
        if (isNaN(localDate.getTime())) {
            console.error('Created invalid date:', localDate);
            throw new Error('Invalid resulting date');
        }
        
        // Convert to UTC ISO string - this will apply the proper timezone offset
        const utcTimestamp = localDate.toISOString();
        console.log(`[parseRawTimestamp] Local timestamp: ${localDate.toString()}, UTC: ${utcTimestamp}`);
        
        return utcTimestamp;
    } catch (error) {
        console.error('Error parsing timestamp:', error);
        // Fallback - create a current timestamp in ISO format
        return new Date().toISOString();
    }
}