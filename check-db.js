require('dotenv').config();
const prisma = require('./config/prisma');

async function main() {
  const t = await prisma.territory.findMany({ include: { kingdom: true } });
  console.log(JSON.stringify(t, null, 2));
}

main()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
