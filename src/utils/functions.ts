const monthStringToInt: { [key: string]: number } = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
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
        const month: string = String(monthNum).padStart(2, '0');
        
        // Create a proper Date object
        const dateStr = `${year}-${month}-${day}T${time}.000Z`;
        
        // Validate the date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.error('Created invalid date:', dateStr);
            throw new Error('Invalid resulting date');
        }
        
        return date.toISOString();
    } catch (error) {
        console.error('Error parsing timestamp:', error);
        // Fallback - create a current timestamp in ISO format
        return new Date().toISOString();
    }
}