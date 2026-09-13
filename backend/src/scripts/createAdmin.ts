import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: npm run create-admin -- admin@example.com "password"');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

await prisma.admin.upsert({
  where: { email: email.toLowerCase() },
  update: { passwordHash },
  create: { email: email.toLowerCase(), passwordHash }
});

console.log(`Admin created/updated: ${email}`);
await prisma.$disconnect();
