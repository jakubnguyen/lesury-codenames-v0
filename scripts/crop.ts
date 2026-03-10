import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const IMAGES_DIR = '/Users/vojtechhrdina/Documents/Projects/Lesury/Images';
const OUTPUT_DIR =
    '/Users/vojtechhrdina/Documents/Projects/Lesury/Development/GitRepository/apps/web/public/games/the-line/cards';
const CSV_PATH =
    '/Users/vojtechhrdina/Documents/Projects/Lesury/Development/GitRepository/packages/game-logic/src/games/the-line/data/events.csv';

// Build sequential number → CSV ID mapping from the CSV
function buildIdMapping(): Map<number, string> {
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });
    const mapping = new Map<number, string>();
    records.forEach((record: any, index: number) => {
        mapping.set(index + 1, record.id); // 1-indexed
    });
    return mapping;
}

// Each grid image configuration: filename pattern start-end → columns x rows
// Based on visual inspection of all 20 images
interface GridConfig {
    filename: string;
    startNum: number; // first card number in this grid
    endNum: number; // last card number in this grid
    cols: number;
    rows: number;
}

const gridConfigs: GridConfig[] = [
    { filename: 'Lesury 1-25.jpg', startNum: 1, endNum: 25, cols: 5, rows: 5 },
    { filename: 'Lesury 26-50.jpg', startNum: 26, endNum: 50, cols: 5, rows: 5 },
    { filename: 'Lesury 51-75.jpg', startNum: 51, endNum: 75, cols: 5, rows: 5 },
    { filename: 'Lesury 76-100.jpg', startNum: 76, endNum: 100, cols: 7, rows: 4 },
    { filename: 'Lesury 101-125.jpg', startNum: 101, endNum: 125, cols: 5, rows: 5 },
    { filename: 'Lesury 126-150.jpg', startNum: 126, endNum: 150, cols: 7, rows: 4 },
    { filename: 'Lesury 151-175.jpg', startNum: 151, endNum: 175, cols: 5, rows: 5 },
    { filename: 'Lesury 176-200.jpg', startNum: 176, endNum: 200, cols: 7, rows: 4 },
    { filename: 'Lesury 201-225.jpg', startNum: 201, endNum: 225, cols: 5, rows: 5 },
    { filename: 'Lesury 226-250.jpg', startNum: 226, endNum: 250, cols: 5, rows: 5 },
    { filename: 'Lesury 251-275.jpg', startNum: 251, endNum: 275, cols: 8, rows: 4 },
    { filename: 'Lesury 276-300.jpg', startNum: 276, endNum: 300, cols: 7, rows: 4 },
    { filename: 'Lesury 300-325.jpg', startNum: 301, endNum: 325, cols: 7, rows: 4 },
    { filename: 'Lesury 326-350.jpg', startNum: 326, endNum: 350, cols: 7, rows: 4 },
    { filename: 'Lesury 351-375.jpg', startNum: 351, endNum: 375, cols: 7, rows: 4 },
    { filename: 'Lesury 376-400.jpg', startNum: 376, endNum: 400, cols: 5, rows: 5 },
    { filename: 'Lesury 401-425.jpg', startNum: 401, endNum: 425, cols: 5, rows: 5 },
    { filename: 'Lesury 426-450.jpg', startNum: 426, endNum: 450, cols: 7, rows: 4 },
    { filename: 'Lesury 451-475.jpg', startNum: 451, endNum: 475, cols: 7, rows: 4 },
    { filename: 'Lesury 476-500.jpg', startNum: 476, endNum: 500, cols: 7, rows: 4 },
];

async function cropGrid(config: GridConfig, idMapping: Map<number, string>) {
    const imagePath = path.join(IMAGES_DIR, config.filename);

    if (!fs.existsSync(imagePath)) {
        console.error(`❌ File not found: ${imagePath}`);
        return;
    }

    const metadata = await sharp(imagePath).metadata();
    const imgWidth = metadata.width!;
    const imgHeight = metadata.height!;

    const cellWidth = Math.floor(imgWidth / config.cols);
    const cellHeight = Math.floor(imgHeight / config.rows);

    const totalItems = config.endNum - config.startNum + 1;

    console.log(`\n📁 Processing: ${config.filename}`);
    console.log(
        `   Image: ${imgWidth}x${imgHeight}, Grid: ${config.cols}x${config.rows}, Cell: ${cellWidth}x${cellHeight}, Items: ${totalItems}`
    );

    let itemIndex = 0;
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            if (itemIndex >= totalItems) break;

            const seqNum = config.startNum + itemIndex;
            const cardId = idMapping.get(seqNum);

            if (!cardId) {
                console.warn(`   ⚠️ No CSV ID found for sequential number ${seqNum}, skipping`);
                itemIndex++;
                continue;
            }

            const left = col * cellWidth;
            const top = row * cellHeight;

            // Clamp width/height to image bounds
            const extractWidth = Math.min(cellWidth, imgWidth - left);
            const extractHeight = Math.min(cellHeight, imgHeight - top);

            const outputPath = path.join(OUTPUT_DIR, `${cardId}.png`);

            try {
                await sharp(imagePath)
                    .extract({ left, top, width: extractWidth, height: extractHeight })
                    .png()
                    .toFile(outputPath);
                console.log(`   ✅ ${cardId}.png (card #${seqNum})`);
            } catch (err) {
                console.error(`   ❌ Error saving ${cardId}.png:`, err);
            }

            itemIndex++;
        }
    }
}

async function main() {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Build mapping from CSV
    const idMapping = buildIdMapping();
    console.log(`📋 Loaded ${idMapping.size} card IDs from CSV`);
    console.log(`📂 Output directory: ${OUTPUT_DIR}`);

    // Process each grid image
    for (const config of gridConfigs) {
        await cropGrid(config, idMapping);
    }

    // Check how many files we generated
    const generatedFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png'));
    console.log(`\n🎉 Done! Generated ${generatedFiles.length} individual card images.`);
}

main().catch(console.error);
