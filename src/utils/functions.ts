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

/*
 * Parses data into a format that we can use for SQL
 */
export function parseRawTimestamp(rawTimestamp: string): string {
    // Remove day, then separate by spaces
    const parts: string[] = rawTimestamp.split(',')[1].split(' ');
    const month: string = monthStringToInt[parts[1]];
    const day: string = parts[2];
    const year: string = parts[3];
    const time: string = parts[4];
    return `${year}-${month}-${day} ${time}`;
}