import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/crypto';

const prisma = new PrismaClient();

const BALANCE = 4_000_000;

function avatarForUserId(userId: number): string {
  return `/img/notion-avatar-${(userId % 6) + 1}.png`;
}

const packages = [
  {
    name: 'Essential',
    price: 49000,
    durationDays: 30,
    features:
      'Kualitas 720p (HD)|Tonton di 2 perangkat|Bebas iklan premium|Download film offline',
    isActive: true,
  },
  {
    name: 'Professional',
    price: 79000,
    durationDays: 30,
    features:
      'Kualitas 1080p (Full HD)|Tonton di 4 perangkat|Streaming tanpa batas|Spatial audio support|Konten original chill',
    isActive: true,
  },
  {
    name: 'Ultimate',
    price: 119000,
    durationDays: 30,
    features:
      'Kualitas 4K + HDR10|Tonton di 6 perangkat|Dolby Atmos & Vision|Akses awal film baru|Kualitas bit-rate tinggi',
    isActive: true,
  },
];

const genreNames = [
  'Action',
  'Drama',
  'Sci-Fi',
  'Thriller',
  'Adventure',
  'Comedy',
  'Horror',
  'Animation',
];

const superadminMovies = [
  {
    title: 'Spider-Man: Into the Spider-Verse',
    image: '/film/26-spider-verse.jpg',
    description:
      'Miles Morales menjadi Spider-Man dan bertemu Spider-Man dari dimensi lain.',
    fullDescription:
      'Miles Morales, remaja Brooklyn, menjadi Spider-Man dari realitasnya dan bergabung dengan Spider-Man dari dimensi lain untuk menyelamatkan setiap alam semesta.',
    rating: 8.4,
    year: 2018,
    category: 'Animation',
    trailerId: 'g4Hbz2jLxvQ',
    tomatoLink:
      'https://www.rottentomatoes.com/m/spider_man_into_the_spider_verse',
    genre: 'Animation',
  },
  {
    title: 'Mad Max: Fury Road',
    image: '/film/22-mad-max-fury-road.jpg',
    description:
      'Max dan Furiosa melarikan diri dari tirani Immortan Joe di gurun pasca-apokaliptik.',
    fullDescription:
      'Di dunia pasca-apokaliptik yang gersang, Max bergabung dengan Furiosa untuk melarikan diri dari tirani Immortan Joe dan pasukannya.',
    rating: 8.1,
    year: 2015,
    category: 'Action',
    trailerId: 'hEJnMQG9ev8',
    tomatoLink: 'https://www.rottentomatoes.com/m/mad_max_fury_road',
    genre: 'Action',
  },
  {
    title: 'Knives Out',
    image: '/film/25-knives-out.jpg',
    description:
      'Detektif investigasi kematian misterius patriark keluarga kaya.',
    fullDescription:
      'Detektif brilian Benoit Blanc investigasi kematian misterius patriark keluarga kaya, dan setiap anggota keluarga menjadi tersangka.',
    rating: 7.9,
    year: 2019,
    category: 'Thriller',
    trailerId: 'qGqiHJTsRkQ',
    tomatoLink: 'https://www.rottentomatoes.com/m/knives_out',
    genre: 'Thriller',
  },
  {
    title: 'Whiplash',
    image: '/film/24-whiplash.jpg',
    description:
      'Drummer muda berambisi di bawah instruktur musik yang kejam dan perfeksionis.',
    fullDescription:
      'Seorang drummer jazz berbakat di sekolah musik bergengsi menemukan dirinya di bawah instruktur yang kejam dan perfeksionis yang akan mendorongnya ke batas.',
    rating: 8.5,
    year: 2014,
    category: 'Drama',
    trailerId: '7d_jQycdQGo',
    tomatoLink: 'https://www.rottentomatoes.com/m/whiplash_2014',
    genre: 'Drama',
  },
  {
    title: 'The Social Network',
    image: '/film/23-social-network.jpg',
    description:
      'Kisah penciptaan Facebook dan gugatan hukum yang mengikutinya.',
    fullDescription:
      'Ketika Mark Zuckerberg menciptakan Facebook, ia menjadi miliarder muda, tetapi juga mendapat gugatan hukum dari dua saudara yang mengklaim ide tersebut.',
    rating: 7.8,
    year: 2010,
    category: 'Drama',
    trailerId: 'lB95KLmpLR4',
    tomatoLink: 'https://www.rottentomatoes.com/m/social_network',
    genre: 'Drama',
  },
  {
    title: 'Minions: Minions & Monsters',
    image: '/film/minions.jpg',
    description:
      'Niat membuat film sendiri, para Minions justru tak sengaja memicu teror monster sungguhan.',
    fullDescription:
      'Sekelompok Minions yang dipecat dari Hollywood nekat membuat film sendiri, namun berakhir kacau ketika mereka tak sengaja melepaskan monster sungguhan yang mengancam dunia.',
    rating: 6.3,
    year: 2026,
    category: 'Animation',
    trailerId: 'V-O-uBaHk3c',
    tomatoLink: 'https://www.rottentomatoes.com/m/minions',
    genre: 'Animation',
  },
];

const adminMovies = [
  {
    title: 'The Matrix',
    image: '/film/18-matrix.jpg',
    description:
      'Seorang hacker menemukan kebenaran mengerikan tentang realitas dan perannya dalam perang.',
    fullDescription:
      'Seorang hacker komputer menemukan bahwa realitas yang ia alami sebenarnya simulasi komputer dan ia terlibat dalam pemberontakan melawan mesin.',
    rating: 8.7,
    year: 1999,
    category: 'Sci-Fi',
    trailerId: 'vKQi3bBA1y8',
    tomatoLink: 'https://www.rottentomatoes.com/m/the_matrix',
    genre: 'Sci-Fi',
  },
  {
    title: 'Gladiator',
    image: '/film/19-gladiator.jpg',
    description:
      'Jenderal Romawi yang dihukum menjadi gladiator mencari balas dendam.',
    fullDescription:
      'Ketika seorang jenderal Romawi yang dihormati dijual ke dalam perbudakan, ia harus berjuang sebagai gladiator untuk membalas dendam terhadap Kaisar yang korup.',
    rating: 8.5,
    year: 2000,
    category: 'Action',
    trailerId: 'owK1qxDselE',
    tomatoLink: 'https://www.rottentomatoes.com/m/gladiator',
    genre: 'Action',
  },
  {
    title: 'Black Panther',
    image: '/film/17-black-panther.jpg',
    description:
      "T'Challa kembali ke Wakanda untuk mengambil alih takhta sebagai Black Panther.",
    fullDescription:
      "T'Challa kembali ke Wakanda setelah kematian ayahnya untuk mengambil alih takhta sebagai raja. Namun, musuh dari masa lalu mengancam nasib kerajaan dan seluruh dunia.",
    rating: 7.3,
    year: 2018,
    category: 'Action',
    trailerId: 'xjDjIWPwcPU',
    tomatoLink: 'https://www.rottentomatoes.com/m/black_panther_2018',
    genre: 'Action',
  },
  {
    title: 'La La Land',
    image: '/film/20-la-la-land.jpg',
    description:
      'Seorang pianis jazz dan aktris berjuang mempertahankan cinta dan impian di Los Angeles.',
    fullDescription:
      'Seorang pianis jazz dan aktris berjuang mempertahankan hubungan mereka sambil mengejar impian masing-masing di Los Angeles.',
    rating: 8.0,
    year: 2016,
    category: 'Drama',
    trailerId: '0pdqf4P9MB8',
    tomatoLink: 'https://www.rottentomatoes.com/m/la_la_land',
    genre: 'Drama',
  },
];

async function clearDatabase() {
  console.log('Resetting database...');
  await prisma.referralCommission.deleteMany({});
  await prisma.transactionHistory.deleteMany({});
  await prisma.userSubscription.deleteMany({});
  await prisma.movieView.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.userBalance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.package.deleteMany({});
  console.log('Database cleared.');
}

async function main() {
  await clearDatabase();

  console.log('Seeding packages...');
  for (const pkg of packages) {
    await prisma.package.create({ data: pkg });
  }

  console.log('Seeding genres...');
  const genreMap: Record<string, number> = {};
  for (const name of genreNames) {
    const genre = await prisma.genre.create({ data: { name } });
    genreMap[name] = genre.id;
  }

  console.log('Seeding users...');
  const superadminPassword = hashPassword('superadmin123');
  const adminPassword = hashPassword('admin123');
  const userPassword = hashPassword('user123');
  const user2Password = hashPassword('user2-123');

  const superadmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'superadmin@superadmin.com',
      password: superadminPassword,
      role: 'superadmin',
      isVerified: true,
      profile: {
        create: {
          fullName: 'Super Admin',
          avatar: avatarForUserId(1),
        },
      },
      balance: { create: { balance: BALANCE } },
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@admin.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      profile: {
        create: {
          fullName: 'Admin',
          avatar: avatarForUserId(2),
        },
      },
      balance: { create: { balance: BALANCE } },
    },
  });

  const user1 = await prisma.user.create({
    data: {
      username: 'user',
      email: 'user@user.com',
      password: userPassword,
      role: 'user',
      isVerified: true,
      referralCode: 'REFUSER001',
      profile: {
        create: {
          fullName: 'User Pertama',
          avatar: avatarForUserId(3),
        },
      },
      balance: { create: { balance: BALANCE } },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'user2',
      email: 'user2@user.com',
      password: user2Password,
      role: 'user',
      isVerified: true,
      referralCode: 'REFUSER002',
      referredById: user1.id,
      profile: {
        create: {
          fullName: 'User Kedua',
          avatar: avatarForUserId(4),
        },
      },
      balance: { create: { balance: BALANCE } },
    },
  });

  console.log('Seeding superadmin movies (6)...');
  for (const movie of superadminMovies) {
    await prisma.movie.create({
      data: {
        title: movie.title,
        description: movie.description,
        fullDescription: movie.fullDescription,
        image: movie.image,
        rating: movie.rating,
        year: movie.year,
        category: movie.category,
        trailerId: movie.trailerId,
        tomatoLink: movie.tomatoLink,
        genreId: genreMap[movie.genre],
        authorId: superadmin.id,
      },
    });
  }

  console.log('Seeding admin movies (4)...');
  for (const movie of adminMovies) {
    await prisma.movie.create({
      data: {
        title: movie.title,
        description: movie.description,
        fullDescription: movie.fullDescription,
        image: movie.image,
        rating: movie.rating,
        year: movie.year,
        category: movie.category,
        trailerId: movie.trailerId,
        tomatoLink: movie.tomatoLink,
        genreId: genreMap[movie.genre],
        authorId: admin.id,
      },
    });
  }

  console.log('Seeding user2 subscription & referral commission...');
  const essentialPackage = await prisma.package.findUnique({
    where: { name: 'Essential' },
  });
  if (!essentialPackage) throw new Error('Essential package not found');

  const commissionAmount = essentialPackage.price * 0.1;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  await prisma.$transaction(async (tx) => {
    await tx.userBalance.update({
      where: { userId: user2.id },
      data: { balance: { decrement: essentialPackage.price } },
    });

    await tx.transactionHistory.create({
      data: {
        userId: user2.id,
        amount: essentialPackage.price,
        type: 'SUBSCRIBE',
        status: 'SUCCESS',
        description: `Pembelian paket ${essentialPackage.name}`,
      },
    });

    await tx.userSubscription.create({
      data: {
        userId: user2.id,
        packageId: essentialPackage.id,
        startDate,
        endDate,
        isActive: true,
      },
    });

    await tx.referralCommission.create({
      data: {
        referrerId: user1.id,
        refereeId: user2.id,
        amount: commissionAmount,
      },
    });

    await tx.userBalance.update({
      where: { userId: user1.id },
      data: { balance: { increment: commissionAmount } },
    });

    await tx.transactionHistory.create({
      data: {
        userId: user1.id,
        amount: commissionAmount,
        type: 'REFERRAL_COMMISSION',
        status: 'SUCCESS',
        description: `Komisi referral dari pembelian ${user2.username}`,
      },
    });
  });

  console.log('Seeding complete.');
  console.log(`  - 4 users (saldo awal Rp ${BALANCE.toLocaleString('id-ID')})`);
  console.log('  - 6 film superadmin + 4 film admin');
  console.log(
    `  - user2 referral dari user1, komisi Rp ${commissionAmount.toLocaleString('id-ID')} untuk user1`,
  );
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
