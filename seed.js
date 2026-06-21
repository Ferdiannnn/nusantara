require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('./config/prisma');

async function main() {
    console.log("Seeding Kingdoms...");
    // Create Kingdoms
    const kingdomsData = [
        { name: 'Majapahit', color_hex: '#ef4444' }, // Red
        { name: 'Sriwijaya', color_hex: '#eab308' }, // Yellow
        { name: 'Pajajaran', color_hex: '#22c55e' }  // Green
    ];

    for (const kingdom of kingdomsData) {
        await prisma.kingdom.upsert({
            where: { name: kingdom.name },
            update: {},
            create: kingdom
        });
    }
    console.log('Kingdoms seeded successfully!');

    // Read Territories from GeoJSON
    console.log("Seeding Territories from maps/gadm41_IDN_1.json...");
    const mapDataPath = path.join(__dirname, 'maps', 'gadm41_IDN_1.json');
    if (fs.existsSync(mapDataPath)) {
        const rawData = fs.readFileSync(mapDataPath);
        const mapData = JSON.parse(rawData);
        const features = mapData.features;

        let addedCount = 0;
        for (const feature of features) {
            const code = feature.properties.GID_1;
            const name = feature.properties.NAME_1;
            
            await prisma.territory.upsert({
                where: { code: code },
                update: {},
                create: {
                    code: code,
                    name: name,
                    troops_count: 100, // Neutral start with 100 troops
                    kingdom_id: null
                }
            });
            addedCount++;
        }
        console.log(`Seeded ${addedCount} Territories successfully!`);
    } else {
        console.warn("Map data file not found at " + mapDataPath);
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });