export function formatTimestamp(timestamp: string | null | undefined): string {
    if (timestamp === null || timestamp === undefined) {
        return "";
    }
    const date = new Date(timestamp);
    return date.toLocaleString().replace(/T/, ' ').replace(/\..+/, '');
}

export function roundNumber(num: number, precision: number = 6): string {
    return Number( num.toPrecision(precision) ).toString();
}

export function capDecimals(num: number, maxDecimals: number = 3): string {
    return Number(num.toFixed(maxDecimals)).toString();
}

export function formatRA(ra:number): string {
    const hours = Math.floor(ra / 15);
    const minutes = Math.floor((ra % 15) * 4);
    const seconds = ((ra % 15) * 4 - minutes) * 60;
    const fracSeconds = seconds - Math.floor(seconds);
    const wholeSeconds = Math.round(Math.floor(seconds));
    return `${hours.toString().padStart(2,"0")}h ${minutes.toString().padStart(2,"0")}m ${wholeSeconds.toString().padStart(2,"0")}.${fracSeconds.toPrecision(3).toString().slice(2)}s`;
}

export function formatDec(dec:number): string {
    const sign = dec >= 0 ? '+' : '-';
    const absDec = Math.abs(dec);
    const degrees = Math.floor(absDec);
    const minutes = Math.floor((absDec - degrees) * 60);
    const seconds = ((absDec - degrees) * 60 - minutes) * 60;
    return `${sign}${degrees}° ${minutes}' ${seconds.toPrecision(3)}"`;
}