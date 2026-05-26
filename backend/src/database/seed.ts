import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PROJECT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // 1. Roles
  const [adminRole, managerRole, memberRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      create: { name: 'ADMIN', description: 'Platform administrator' },
      update: {},
    }),
    prisma.role.upsert({
      where: { name: 'MANAGER' },
      create: { name: 'MANAGER', description: 'Team / project manager' },
      update: {},
    }),
    prisma.role.upsert({
      where: { name: 'MEMBER' },
      create: { name: 'MEMBER', description: 'Standard member' },
      update: {},
    }),
  ]);

  // 2. Demo users
  const hash = (pw: string): Promise<string> => bcrypt.hash(pw, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@projectcloud.io' },
    update: {},
    create: {
      email: 'admin@projectcloud.io',
      name: 'Ada Admin',
      password: await hash('Admin@123'),
      roleId: adminRole.id,
      isVerified: true,
      avatarUrl: 'https://i.pravatar.cc/150?img=47',
      bio: 'Founder & platform admin.',
      notificationPrefs: { create: {} },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@projectcloud.io' },
    update: {},
    create: {
      email: 'manager@projectcloud.io',
      name: 'Marcus Manager',
      password: await hash('Manager@123'),
      roleId: managerRole.id,
      isVerified: true,
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      bio: 'Engineering team lead.',
      notificationPrefs: { create: {} },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@projectcloud.io' },
    update: {},
    create: {
      email: 'user@projectcloud.io',
      name: 'Maya Member',
      password: await hash('User@123'),
      roleId: memberRole.id,
      isVerified: true,
      avatarUrl: 'https://i.pravatar.cc/150?img=32',
      bio: 'Full-stack engineer.',
      notificationPrefs: { create: {} },
    },
  });

  const extras = await Promise.all(
    [
      { email: 'leo@projectcloud.io', name: 'Leo Designer', avatar: 15 },
      { email: 'nina@projectcloud.io', name: 'Nina Backend', avatar: 23 },
      { email: 'ravi@projectcloud.io', name: 'Ravi DevOps', avatar: 60 },
    ].map(async (u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          name: u.name,
          password: await hash('Welcome@123'),
          roleId: memberRole.id,
          isVerified: true,
          avatarUrl: `https://i.pravatar.cc/150?img=${u.avatar}`,
          notificationPrefs: { create: {} },
        },
      }),
    ),
  );

  // 3. Sample projects
  const projects = await Promise.all(
    [
      {
        name: 'Aurora Mobile App',
        description: 'Customer-facing iOS & Android client with offline support.',
        status: 'ACTIVE',
        priority: 'HIGH',
        progress: 42,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Project Cloud Platform',
        description: 'Marketing site, dashboards, and billing flows.',
        status: 'ACTIVE',
        priority: 'URGENT',
        progress: 65,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Q4 Brand Refresh',
        description: 'Logo system, identity guidelines, and component refresh.',
        status: 'PLANNING',
        priority: 'MEDIUM',
        progress: 18,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ].map((p, i) =>
      prisma.project.create({
        data: {
          ...p,
          color: PROJECT_COLORS[i % PROJECT_COLORS.length],
          startDate: new Date(),
          ownerId: i === 2 ? admin.id : manager.id,
          members: {
            create: [
              { userId: i === 2 ? admin.id : manager.id, role: 'OWNER' },
              { userId: user.id, role: 'MEMBER' },
              { userId: extras[0].id, role: 'MEMBER' },
              { userId: extras[1].id, role: 'MEMBER' },
              ...(i === 1 ? [{ userId: extras[2].id, role: 'MEMBER' as const }] : []),
            ],
          },
        },
      }),
    ),
  );

  // 4. Tasks for each project — kanban columns
  const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const;
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
  const labels = ['design', 'frontend', 'backend', 'api', 'bug', 'feature', 'docs'];

  const sampleTitles = [
    'Set up project repository',
    'Design system tokens',
    'Auth flow with JWT',
    'Build dashboard overview',
    'Kanban drag & drop',
    'Calendar view',
    'Real-time notifications',
    'Mobile responsive QA',
    'Onboarding empty states',
    'Performance audit',
    'CI / CD pipeline',
    'Documentation pass',
  ];

  for (const project of projects) {
    let position = 0;
    for (let i = 0; i < sampleTitles.length; i++) {
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      const assignee = [user, extras[0], extras[1], manager][i % 4];
      const task = await prisma.task.create({
        data: {
          title: `${sampleTitles[i]}`,
          description: `Auto-seeded task for ${project.name}.`,
          status,
          priority,
          position: position++,
          dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          labels: [labels[i % labels.length], labels[(i + 2) % labels.length]].join(','),
          completedAt: status === 'COMPLETED' ? new Date() : null,
          projectId: project.id,
          assigneeId: assignee.id,
          createdById: project.ownerId,
        },
      });

      if (i % 3 === 0) {
        await prisma.checklistItem.createMany({
          data: [
            { taskId: task.id, text: 'Define acceptance criteria', position: 0, done: true },
            { taskId: task.id, text: 'Implement solution', position: 1 },
            { taskId: task.id, text: 'Write tests', position: 2 },
          ],
        });
      }

      if (i % 4 === 0) {
        await prisma.taskComment.create({
          data: {
            taskId: task.id,
            authorId: manager.id,
            body: 'Let me know if you need any help getting this started 👍',
          },
        });
      }
    }
  }

  // 5. Activity logs sample
  await prisma.activityLog.createMany({
    data: [
      {
        userId: manager.id,
        projectId: projects[0].id,
        action: 'CREATED',
        entity: 'PROJECT',
        metadata: JSON.stringify({ name: projects[0].name }),
      },
      {
        userId: user.id,
        projectId: projects[1].id,
        action: 'COMMENTED',
        entity: 'TASK',
      },
    ],
  });

  // 6. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'TASK_ASSIGNED',
        title: 'New task assigned',
        message: 'You were assigned to "Build dashboard overview"',
        link: '/tasks',
      },
      {
        userId: user.id,
        type: 'DEADLINE_SOON',
        title: 'Deadline approaching',
        message: 'Aurora Mobile App is due in 30 days',
        link: '/projects',
      },
    ],
  });

  console.log('✅ Seed complete');
  console.log('   Login as:');
  console.log('     admin@projectcloud.io   / Admin@123');
  console.log('     manager@projectcloud.io / Manager@123');
  console.log('     user@projectcloud.io    / User@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
