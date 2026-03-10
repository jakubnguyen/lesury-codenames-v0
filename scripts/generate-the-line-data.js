const fs = require('fs');
const path = require('path');

const csvPath = path.join(
    __dirname,
    '..',
    'packages/game-logic/src/games/the-line/data/events.csv'
);
const outPath = path.join(__dirname, '..', 'packages/game-logic/src/games/the-line/data.ts');
const imagesDir = path.join(__dirname, '..', 'apps/web/public/games/the-line/cards');

// Scan for existing card images
const existingImages = new Set();
if (fs.existsSync(imagesDir)) {
    fs.readdirSync(imagesDir).forEach((file) => {
        if (file.endsWith('.png')) {
            existingImages.add(file.replace('.png', ''));
        }
    });
}
console.log(`Found ${existingImages.size} card images: ${[...existingImages].join(', ')}`);

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim());
const dataLines = lines.slice(1);

function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

const events = dataLines.map((line) => {
    const cols = parseLine(line);
    return {
        id: cols[0],
        title: cols[1],
        sorting_category: cols[2],
        funfact: cols[3],
        display_value: cols[4],
        unit: cols[5],
        sorting_value: parseFloat(cols[6]),
    };
});

let ts = `/**
 * The Line — Event Dataset
 * Auto-generated from data/events.csv
 * DO NOT EDIT MANUALLY
 */

import type { TheLineEvent } from "./types";

export const allEvents: TheLineEvent[] = [
`;

let imagesCount = 0;
for (const e of events) {
    const hasImage = existingImages.has(e.id);
    if (hasImage) imagesCount++;
    ts += `    {\n`;
    ts += `        id: ${JSON.stringify(e.id)},\n`;
    ts += `        title: ${JSON.stringify(e.title)},\n`;
    ts += `        sorting_category: ${JSON.stringify(e.sorting_category)},\n`;
    ts += `        funfact: ${JSON.stringify(e.funfact)},\n`;
    ts += `        display_value: ${JSON.stringify(e.display_value)},\n`;
    ts += `        unit: ${JSON.stringify(e.unit)},\n`;
    ts += `        sorting_value: ${e.sorting_value},\n`;
    if (hasImage) {
        ts += `        imageUrl: "/games/the-line/cards/${e.id}.png",\n`;
    }
    ts += `    },\n`;
}

ts += `];

/**
 * Get unique category names from the dataset
 */
export function getCategories(): string[] {
    return [...new Set(allEvents.map((e) => e.sorting_category))];
}

/**
 * Get events filtered by a specific category
 */
export function getEventsByCategory(category: string): TheLineEvent[] {
    return allEvents.filter((e) => e.sorting_category === category);
}
`;

fs.writeFileSync(outPath, ts);
console.log(`Generated data.ts with ${events.length} events (${imagesCount} with images)`);
