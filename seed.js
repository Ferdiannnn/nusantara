require('dotenv').config();
const prisma = require('./config/prisma');

async function main() {
    await prisma.kingdom.createMany({
        data: [
            { name: 'Majapahit', color_hex: '#ef4444' }, // Red
            { name: 'Sriwijaya', color_hex: '#eab308' }, // Yellow
            { name: 'Pajajaran', color_hex: '#22c55e' }  // Green
        ],
        skipDuplicates: true
    });
    console.log('Kingdoms seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });