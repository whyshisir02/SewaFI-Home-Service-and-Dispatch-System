const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const categoriesData = [
  {
    name: 'Plumbing',
    description: 'Water, pipe, and drainage services',
    icon: '🔧',
    subCategories: [
      { name: 'Pipe Repair', description: 'Fix leaking or burst pipes' },
      { name: 'Drain Cleaning', description: 'Unclog drains and sewers' },
      { name: 'Water Tank Installation', description: 'Install water tanks' },
      { name: 'Bathroom Fittings', description: 'Install/repair bathroom fixtures' },
      { name: 'Water Heater', description: 'Geyser and heater services' },
    ],
    services: [
      { name: 'Basic Plumbing Service', description: 'General plumbing inspection and minor fixes', basePrice: 800, sub: 'Pipe Repair' },
      { name: 'Pipe Leak Fix', description: 'Fix leaking pipes', basePrice: 1200, sub: 'Pipe Repair' },
      { name: 'Drain Unclogging', description: 'Clear blocked drains', basePrice: 1000, sub: 'Drain Cleaning' },
      { name: 'Water Tank Setup', description: 'Install new water tank', basePrice: 3500, sub: 'Water Tank Installation' },
      { name: 'Geyser Repair', description: 'Fix water heater issues', basePrice: 1500, sub: 'Water Heater' },
    ],
  },
  {
    name: 'Electrical',
    description: 'Electrical wiring and appliance services',
    icon: '⚡',
    subCategories: [
      { name: 'Wiring & Installation', description: 'New electrical wiring' },
      { name: 'Switch & Socket Repair', description: 'Fix switches and outlets' },
      { name: 'Fan Installation', description: 'Ceiling and wall fans' },
      { name: 'Light Installation', description: 'LED, CFL, chandeliers' },
      { name: 'Inverter & UPS', description: 'Power backup systems' },
    ],
    services: [
      { name: 'Electrical Inspection', description: 'Full home electrical check', basePrice: 700, sub: 'Wiring & Installation' },
      { name: 'New Wiring', description: 'Install new electrical wiring', basePrice: 2500, sub: 'Wiring & Installation' },
      { name: 'Switch Replacement', description: 'Replace faulty switches', basePrice: 500, sub: 'Switch & Socket Repair' },
      { name: 'Ceiling Fan Installation', description: 'Install ceiling fan', basePrice: 800, sub: 'Fan Installation' },
      { name: 'LED Light Setup', description: 'Install LED lighting', basePrice: 600, sub: 'Light Installation' },
    ],
  },
  {
    name: 'Cleaning',
    description: 'Home and office cleaning services',
    icon: '🧹',
    subCategories: [
      { name: 'House Cleaning', description: 'Full home cleaning' },
      { name: 'Bathroom Deep Clean', description: 'Deep bathroom cleaning' },
      { name: 'Kitchen Deep Clean', description: 'Kitchen sanitization' },
      { name: 'Carpet Cleaning', description: 'Carpet and rug cleaning' },
      { name: 'Sofa Cleaning', description: 'Upholstery cleaning' },
      { name: 'Office Cleaning', description: 'Commercial cleaning' },
    ],
    services: [
      { name: 'Standard House Cleaning', description: '2-3 hours general cleaning', basePrice: 1500, sub: 'House Cleaning' },
      { name: 'Deep House Cleaning', description: 'Thorough 5-6 hour cleaning', basePrice: 3000, sub: 'House Cleaning' },
      { name: 'Bathroom Deep Clean', description: 'Detailed bathroom sanitization', basePrice: 1200, sub: 'Bathroom Deep Clean' },
      { name: 'Kitchen Deep Clean', description: 'Full kitchen cleaning', basePrice: 1500, sub: 'Kitchen Deep Clean' },
      { name: 'Sofa Cleaning (3-seater)', description: 'Professional sofa cleaning', basePrice: 1800, sub: 'Sofa Cleaning' },
    ],
  },
  {
    name: 'Carpentry',
    description: 'Furniture and woodwork services',
    icon: '🔨',
    subCategories: [
      { name: 'Furniture Repair', description: 'Fix broken furniture' },
      { name: 'Custom Furniture', description: 'Build custom pieces' },
      { name: 'Door Installation', description: 'Doors and frames' },
      { name: 'Window Repair', description: 'Window fixes' },
      { name: 'Cabinet Making', description: 'Kitchen and storage cabinets' },
    ],
    services: [
      { name: 'Furniture Repair', description: 'Fix broken furniture', basePrice: 1000, sub: 'Furniture Repair' },
      { name: 'Door Installation', description: 'Install new door', basePrice: 2500, sub: 'Door Installation' },
      { name: 'Window Frame Fix', description: 'Repair window frames', basePrice: 1500, sub: 'Window Repair' },
      { name: 'Custom Shelf Build', description: 'Build custom shelves', basePrice: 3000, sub: 'Custom Furniture' },
    ],
  },
  {
    name: 'AC & Appliance',
    description: 'AC, refrigerator, and appliance repair',
    icon: '❄️',
    subCategories: [
      { name: 'AC Service', description: 'AC cleaning and gas refill' },
      { name: 'AC Installation', description: 'Install new AC' },
      { name: 'Refrigerator Repair', description: 'Fridge servicing' },
      { name: 'Washing Machine Repair', description: 'Washer fixes' },
      { name: 'Microwave Repair', description: 'Microwave servicing' },
    ],
    services: [
      { name: 'AC Cleaning Service', description: 'Deep AC cleaning', basePrice: 1500, sub: 'AC Service' },
      { name: 'AC Gas Refill', description: 'Refill AC refrigerant', basePrice: 2500, sub: 'AC Service' },
      { name: 'AC Installation', description: 'Install new AC unit', basePrice: 3500, sub: 'AC Installation' },
      { name: 'Refrigerator Repair', description: 'Fix fridge issues', basePrice: 1200, sub: 'Refrigerator Repair' },
      { name: 'Washing Machine Service', description: 'Repair washing machine', basePrice: 1500, sub: 'Washing Machine Repair' },
    ],
  },
  {
    name: 'Painting',
    description: 'Wall painting and decoration',
    icon: '🎨',
    subCategories: [
      { name: 'Interior Painting', description: 'Inside walls' },
      { name: 'Exterior Painting', description: 'Outside walls' },
      { name: 'Texture Painting', description: 'Decorative finish' },
      { name: 'Wood Polishing', description: 'Furniture finish' },
    ],
    services: [
      { name: 'Room Painting (Standard)', description: 'Paint single room', basePrice: 4000, sub: 'Interior Painting' },
      { name: 'Full House Painting', description: 'Complete home painting', basePrice: 25000, sub: 'Interior Painting' },
      { name: 'Texture Wall Design', description: 'Decorative texture work', basePrice: 6000, sub: 'Texture Painting' },
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Create Admin
  const adminPassword = await bcrypt.hash('Password@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@sewafi.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@sewafi.com',
      phone: '9800000001',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan',
    },
  });
  console.log('✅ Admin created');

  // Create Customer
  const customerPassword = await bcrypt.hash('Password@123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@sewafi.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@sewafi.com',
      phone: '9800000002',
      password: customerPassword,
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: true,
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan',
    },
  });
  console.log('✅ Customer created');

  // Seed categories, sub-categories, services
  for (const cat of categoriesData) {
    const category = await prisma.serviceCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, icon: cat.icon },
      create: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
      },
    });

    // Sub-categories
    const subMap = {};
    for (const sub of cat.subCategories) {
      const subCategory = await prisma.subCategory.upsert({
        where: {
          name_categoryId: {
            name: sub.name,
            categoryId: category.id,
          },
        },
        update: { description: sub.description },
        create: {
          name: sub.name,
          description: sub.description,
          categoryId: category.id,
        },
      });
      subMap[sub.name] = subCategory.id;
    }

    // Services
    for (const svc of cat.services) {
      const existing = await prisma.service.findFirst({
        where: { name: svc.name, categoryId: category.id },
      });
      if (!existing) {
        await prisma.service.create({
          data: {
            name: svc.name,
            description: svc.description,
            basePrice: svc.basePrice,
            categoryId: category.id,
            subCategoryId: subMap[svc.sub] || null,
          },
        });
      }
    }
    console.log(`✅ Category seeded: ${cat.name}`);
  }

  // Create approved test provider
  const providerPassword = await bcrypt.hash('Password@123', 10);
  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@sewafi.com' },
    update: {},
    create: {
      name: 'Test Provider',
      email: 'provider@sewafi.com',
      phone: '9800000003',
      password: providerPassword,
      role: 'PROVIDER',
      isActive: true,
      isEmailVerified: true,
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan',
    },
  });

  const plumbingCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Plumbing' },
  });

  if (plumbingCategory) {
    await prisma.providerProfile.upsert({
      where: { userId: providerUser.id },
      update: {},
      create: {
        userId: providerUser.id,
        categoryId: plumbingCategory.id,
        experienceYears: 5,
        bio: 'Experienced plumber with 5 years of expertise',
        expertise: ['Pipe Fitting', 'Drain Cleaning', 'Bathroom Setup'],
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
  }
  console.log('✅ Provider created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());