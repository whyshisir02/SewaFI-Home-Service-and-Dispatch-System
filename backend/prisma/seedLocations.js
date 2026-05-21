const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const nepalData = [
  // Bagmati Province
  { province: 'Bagmati', district: 'Kathmandu', municipalities: ['Kathmandu Metropolitan', 'Kirtipur Municipality', 'Tokha Municipality', 'Budhanilkantha Municipality', 'Tarakeshwor Municipality', 'Gokarneshwor Municipality', 'Chandragiri Municipality', 'Nagarjun Municipality', 'Dakshinkali Municipality', 'Shankharapur Municipality', 'Kageshwori Manohara Municipality'] },
  { province: 'Bagmati', district: 'Lalitpur', municipalities: ['Lalitpur Metropolitan', 'Mahalaxmi Municipality', 'Godawari Municipality'] },
  { province: 'Bagmati', district: 'Bhaktapur', municipalities: ['Bhaktapur Municipality', 'Madhyapur Thimi Municipality', 'Suryabinayak Municipality', 'Changunarayan Municipality'] },
  { province: 'Bagmati', district: 'Chitwan', municipalities: ['Bharatpur Metropolitan', 'Ratnanagar Municipality', 'Khairahani Municipality', 'Rapti Municipality', 'Kalika Municipality'] },
  
  // Gandaki Province
  { province: 'Gandaki', district: 'Kaski', municipalities: ['Pokhara Metropolitan', 'Annapurna Rural', 'Madi Rural'] },
  { province: 'Gandaki', district: 'Tanahun', municipalities: ['Bhanu Municipality', 'Shuklagandaki Municipality', 'Vyas Municipality'] },
  
  // Province 1 (Koshi)
  { province: 'Koshi', district: 'Morang', municipalities: ['Biratnagar Metropolitan', 'Belbari Municipality', 'Letang Municipality'] },
  { province: 'Koshi', district: 'Sunsari', municipalities: ['Itahari Sub-Metropolitan', 'Dharan Sub-Metropolitan', 'Inaruwa Municipality'] },
  
  // Lumbini Province
  { province: 'Lumbini', district: 'Rupandehi', municipalities: ['Butwal Sub-Metropolitan', 'Siddharthanagar Municipality', 'Tilottama Municipality'] },
  { province: 'Lumbini', district: 'Kapilvastu', municipalities: ['Kapilvastu Municipality', 'Buddhabhumi Municipality'] },
  
  // Madhesh Province
  { province: 'Madhesh', district: 'Dhanusha', municipalities: ['Janakpur Sub-Metropolitan', 'Kshireshwarnath Municipality'] },
  
  // Sudurpashchim Province
  { province: 'Sudurpashchim', district: 'Kailali', municipalities: ['Dhangadhi Sub-Metropolitan', 'Tikapur Municipality'] },
  
  // Karnali Province
  { province: 'Karnali', district: 'Surkhet', municipalities: ['Birendranagar Municipality', 'Bheriganga Municipality'] },
];

async function seedLocations() {
  console.log('🌍 Seeding Nepal locations...');
  
  for (const item of nepalData) {
    for (const municipality of item.municipalities) {
      await prisma.nepalLocation.upsert({
        where: {
          province_district_municipality: {
            province: item.province,
            district: item.district,
            municipality,
          },
        },
        update: {},
        create: {
          province: item.province,
          district: item.district,
          municipality,
        },
      });
    }
  }
  
  console.log('✅ Nepal locations seeded successfully');
}

seedLocations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());