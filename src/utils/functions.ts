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

/*
 * Parses data into a format that we can use for SQL
 */
export function parseRawTimestamp(rawTimestamp: string): string {
    // Remove day, then separate by spaces
    const parts: string[] = rawTimestamp.split(',')[1].split(' ');
    console.log(parts)
    const month: string = `${monthStringToInt[parts[1]]}`;
    const day: string = parts[2];
    const year: string = parts[3];
    const time: string = parts[4];
    return `${year}-${month}-${day} ${time}`;
}