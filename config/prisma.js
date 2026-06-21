// config/prisma.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg'); // Import the adapter

// Create the adapter instance with your database URL
const connectionString = process.env.DATABASE_URL || process.env.nusantara_PRISMA_DATABASE_URL || process.env.nusantara_DATABASE_URL;
const adapter = new PrismaPg({
  connectionString: connectionString,
});

// Pass the adapter to PrismaClient
const prisma = new PrismaClient({
  adapter: adapter,
  // If you are NOT using Prisma Accelerate, ensure you do NOT have 
  // @prisma/extension-accelerate installed, or remove it:
  // npm uninstall @prisma/extension-accelerate
});

async function main() {
  // Test connection
  await prisma.$connect();
  console.log('Database connected successfully');
}

main()
  .catch((e) => {
    console.error('Failed to connect to database:', e);
    process.exit(1);
  })
  .finally(async () => {
    // In a long-running Express app, you typically do NOT disconnect 
    // on every request, only on process shutdown.
    // await prisma.$disconnect(); 
  });

module.exports = prisma;   