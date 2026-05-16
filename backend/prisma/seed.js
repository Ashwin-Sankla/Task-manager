// prisma/seed.js
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = fs.existsSync('.env') ? '.env' : '.env.example';
dotenv.config({ path: envPath });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');
  
  // Wipe all existing data to ensure a clean state
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleaned. Seeding demo users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Demo Admin
  const admin = await prisma.user.create({
    data: { 
      name: 'Demo Admin', // Will be overridden to "Ashwin" in frontend
      email: 'admin@demo.com', 
      passwordHash,
      systemRole: 'SUPER_ADMIN',
      department: 'Management',
      status: 'ACTIVE'
    },
  });

  // 2. Demo Tasker
  const member = await prisma.user.create({
    data: { 
      name: 'Demo Tasker', 
      email: 'member@demo.com', 
      passwordHash,
      systemRole: 'USER',
      department: 'Engineering',
      status: 'ACTIVE'
    },
  });

  // 3. Inactive User
  const inactiveUser = await prisma.user.create({
    data: { 
      name: 'Inactive Dev', 
      email: 'inactive@demo.com', 
      passwordHash,
      systemRole: 'USER',
      department: 'Engineering',
      status: 'INACTIVE'
    },
  });

  // 4. On Leave User
  const onLeaveUser = await prisma.user.create({
    data: { 
      name: 'Leave Designer', 
      email: 'leave@demo.com', 
      passwordHash,
      systemRole: 'USER',
      department: 'Design',
      status: 'ON_LEAVE'
    },
  });

  console.log('Seeding mock project and tasks...');
  const project = await prisma.project.create({
    data: {
      name: 'Admin Dashboard Project',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ]
      }
    }
  });

  const tasks = [
    { title: 'Setup DB', status: 'DONE', priority: 'HIGH', projectId: project.id, creatorId: admin.id, assigneeId: member.id },
    { title: 'Create UI', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: project.id, creatorId: admin.id, assigneeId: member.id },
    { title: 'Fix bug', status: 'TODO', priority: 'HIGH', projectId: project.id, creatorId: admin.id, assigneeId: admin.id },
    { title: 'Review PR', status: 'TODO', priority: 'LOW', projectId: project.id, creatorId: admin.id, assigneeId: null },
    { title: 'Write tests', status: 'TODO', priority: 'MEDIUM', projectId: project.id, creatorId: admin.id, assigneeId: member.id, dueDate: new Date(Date.now() - 86400000) }, // overdue
  ];

  await prisma.task.createMany({ data: tasks });

  console.log('Seed complete. Clean minimal state ready.');
  console.log('Admin: admin@demo.com / password123');
  console.log('Tasker: member@demo.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
