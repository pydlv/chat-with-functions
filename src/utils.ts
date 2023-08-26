import * as fs from "fs";

export function tryReadJson<T>(filePath: string, defaultValue: T): T {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return defaultValue;
    }
}

export function writeJson<T>(filePath: string, data: T) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}