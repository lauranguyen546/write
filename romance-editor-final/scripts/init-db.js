const fs = require('fs');
const path = require('path');

// Create prisma directory if it doesn't exist
const prismaDir = path.join(__dirname, '..', 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Create empty database file
const dbPath = path.join(prismaDir, 'dev.db');
fs.writeFileSync(dbPath, '');

console.log('Database file created at:', dbPath);
console.log('Note: Prisma will initialize the schema on first use.');
