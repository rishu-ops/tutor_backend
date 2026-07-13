import dotenv from 'dotenv';
import { prisma, connectMongoDB, connectPostgres, RequirementModel } from 'database';

dotenv.config();

async function main() {
  console.log('Starting MongoDB requirement seeding...');

  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb://root:example@localhost:27017/project_tutor?authSource=admin';
  await connectMongoDB(mongoUri);
  console.log('Connected to MongoDB.');

  await connectPostgres();
  console.log('Connected to PostgreSQL.');

  // Find or create a student user to associate the requirements with
  let studentUser = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
  });

  if (!studentUser) {
    console.log('No student user found. Creating a dummy student user...');
    studentUser = await prisma.user.create({
      data: {
        name: 'Jane Doe',
        phone: '9988776655',
        email: 'jane.doe@example.com',
        role: 'STUDENT',
        city: 'Noida',
        isPhoneVerified: true,
      },
    });
    console.log(`Created dummy student user with ID: ${studentUser.id}`);
  } else {
    console.log(`Using existing student user with ID: ${studentUser.id}`);
  }

  // Clear existing requirements first to avoid duplication
  const deleteResult = await RequirementModel.deleteMany({});
  console.log(`Cleared ${deleteResult.deletedCount} existing requirements.`);

  const dummyRequirements = [
    {
      studentUserId: studentUser.id,
      category: 'School Education',
      curriculum: {
        board: 'CBSE',
        level: 'Class 12',
        subject: 'Physics',
      },
      teachingMode: ['Online', 'Home Tuition'],
      schedule: ['Weekends', 'Evening'],
      location: {
        city: 'Noida',
        area: 'Sector 62',
        address: 'Sector 62, Near Metro Station',
      },
      budget: {
        min: 600,
        max: 1000,
        feeType: 'PER_HOUR',
      },
      description:
        'Looking for an experienced Physics teacher for CBSE Class 12 preparation. Focus is on conceptual clarity, board exam prep, and solving past year papers.',
      status: 'OPEN',
      applicationsCount: 0,
    },
    {
      studentUserId: studentUser.id,
      category: 'School Education',
      curriculum: {
        board: 'ICSE',
        level: 'Class 10',
        subject: 'Mathematics',
      },
      teachingMode: ['Home Tuition'],
      schedule: ['Weekdays', 'Evening'],
      location: {
        city: 'Delhi',
        area: 'Connaught Place',
        address: 'Block H, Connaught Place',
      },
      budget: {
        min: 500,
        max: 800,
        feeType: 'PER_HOUR',
      },
      description:
        'Need a home tutor for class 10 Mathematics. Focus on Algebra and Geometry. Daily practice sheets and weekly test support needed.',
      status: 'OPEN',
      applicationsCount: 0,
    },
    {
      studentUserId: studentUser.id,
      category: 'Programming',
      curriculum: {
        subject: 'React & Next.js',
      },
      teachingMode: ['Online'],
      schedule: ['Weekends'],
      location: {
        city: 'Bangalore',
        area: 'Whitefield',
      },
      budget: {
        min: 1000,
        max: 2000,
        feeType: 'PER_HOUR',
      },
      description:
        'Looking to learn modern React (hooks, context, state management) and Next.js (App Router, Server Components) for a portfolio project.',
      status: 'OPEN',
      applicationsCount: 0,
    },
    {
      studentUserId: studentUser.id,
      category: 'School Education',
      curriculum: {
        board: 'CBSE',
        level: 'Class 12',
        subject: 'Chemistry',
      },
      teachingMode: ['Online'],
      schedule: ['Weekdays'],
      location: {
        city: 'Noida',
        area: 'Sector 15',
      },
      budget: {
        min: 800,
        max: 1200,
        feeType: 'PER_HOUR',
      },
      description:
        'Urgent requirement for Chemistry Class 12 board preparations. Major focus needed on Organic Chemistry mechanisms.',
      status: 'OPEN',
      applicationsCount: 0,
    },
    {
      studentUserId: studentUser.id,
      category: 'Languages',
      curriculum: {
        subject: 'Spanish Language',
      },
      teachingMode: ['Online', 'Group Classes'],
      schedule: ['Evening'],
      location: {
        city: 'Mumbai',
        area: 'Andheri West',
      },
      budget: {
        min: 700,
        max: 1100,
        feeType: 'PER_HOUR',
      },
      description:
        'Beginner Spanish lessons for basic conversational fluency. Interactive learning material and flexible schedule preferred.',
      status: 'OPEN',
      applicationsCount: 0,
    },
  ];

  const created = await RequirementModel.insertMany(dummyRequirements);
  console.log(`Successfully seeded ${created.length} MongoDB requirements.`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding MongoDB:', err);
  process.exit(1);
});
