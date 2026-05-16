import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding packages...');
  
  const packages = [
    {
      name: 'Essential',
      price: 49000,
      durationDays: 30,
      features: 'Kualitas 720p (HD)|Tonton di 2 perangkat|Bebas iklan premium|Download film offline',
      isActive: true,
    },
    {
      name: 'Professional',
      price: 79000,
      durationDays: 30,
      features: 'Kualitas 1080p (Full HD)|Tonton di 4 perangkat|Streaming tanpa batas|Spatial audio support|Konten original Chill',
      isActive: true,
    },
    {
      name: 'Ultimate',
      price: 119000,
      durationDays: 30,
      features: 'Kualitas 4K + HDR10|Tonton di 6 perangkat|Dolby Atmos & Vision|Akses awal film baru|Kualitas bit-rate tinggi',
      isActive: true,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: pkg,
    });
  }

  console.log('Seeding users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);

  // Seed Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { isVerified: true },
    create: {
      email: 'user@example.com',
      username: 'user',
      password: hashedPassword,
      role: 'user',
      isVerified: true,
      referralCode: 'REFUSER123',
    },
  });

  // Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { isVerified: true },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedAdminPassword,
      role: 'superadmin',
      isVerified: true,
      referralCode: 'REFADMIN123',
    },
  });

  console.log('Seeding movies...');
  
  // Seed a movie so the home page is not empty
  await prisma.movie.upsert({
    where: { id: 1 }, // Assuming ID 1 or we can just use create if we don't care about duplicates or use findFirst
    update: {},
    create: {
      id: 1,
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
      fullDescription: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkfs619h7mR0zW9C.jpg',
      rating: 8.8,
      year: 2010,
      category: 'movie',
      isNewEpisode: false,
      authorId: admin.id,
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
