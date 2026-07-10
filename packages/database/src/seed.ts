import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/hash.js';

const prisma = new PrismaClient();

const permissions = [
  // User Management
  {
    name: 'user.view',
    module: 'User Management',
    description: 'View user profiles and list users',
  },
  { name: 'user.update', module: 'User Management', description: 'Update user profiles' },
  { name: 'user.suspend', module: 'User Management', description: 'Suspend user accounts' },
  {
    name: 'user.restore',
    module: 'User Management',
    description: 'Restore suspended user accounts',
  },
  { name: 'user.delete', module: 'User Management', description: 'Delete user accounts' },
  // Tutor Management
  { name: 'tutor.view', module: 'Tutor Management', description: 'View tutor profile details' },
  { name: 'tutor.verify', module: 'Tutor Management', description: 'Verify tutor profiles' },
  { name: 'tutor.reject', module: 'Tutor Management', description: 'Reject tutor profiles' },
  { name: 'tutor.edit', module: 'Tutor Management', description: 'Edit tutor profiles' },
  // Requirement Management
  {
    name: 'requirement.view',
    module: 'Requirement Management',
    description: 'View student requirements',
  },
  {
    name: 'requirement.close',
    module: 'Requirement Management',
    description: 'Close student requirements',
  },
  {
    name: 'requirement.delete',
    module: 'Requirement Management',
    description: 'Soft delete student requirements',
  },
  {
    name: 'requirement.restore',
    module: 'Requirement Management',
    description: 'Restore soft deleted requirements',
  },
  // Content Management
  {
    name: 'content.create',
    module: 'Content Management',
    description: 'Create admin posts/announcements',
  },
  { name: 'content.edit', module: 'Content Management', description: 'Edit admin posts' },
  { name: 'content.delete', module: 'Content Management', description: 'Delete admin posts' },
  { name: 'content.publish', module: 'Content Management', description: 'Publish admin posts' },
  // Verification
  { name: 'verification.view', module: 'Verification', description: 'View verification documents' },
  {
    name: 'verification.approve',
    module: 'Verification',
    description: 'Approve verification requests',
  },
  {
    name: 'verification.reject',
    module: 'Verification',
    description: 'Reject verification requests',
  },
  // Reports
  { name: 'report.view', module: 'Reports', description: 'View submitted abuse/spam reports' },
  { name: 'report.resolve', module: 'Reports', description: 'Resolve or dismiss abuse reports' },
  { name: 'report.close', module: 'Reports', description: 'Close abuse reports' },
  // Notifications
  {
    name: 'notification.send',
    module: 'Notifications',
    description: 'Send direct notifications to users',
  },
  {
    name: 'notification.broadcast',
    module: 'Notifications',
    description: 'Broadcast system-wide notices',
  },
  // Subscription
  {
    name: 'subscription.view',
    module: 'Subscription',
    description: 'View subscription plan details',
  },
  {
    name: 'subscription.manage',
    module: 'Subscription',
    description: 'Create/modify subscription plans',
  },
  // Payment
  { name: 'payment.view', module: 'Payment', description: 'View transactions' },
  { name: 'payment.refund', module: 'Payment', description: 'Process payment refunds' },
  // Admin
  { name: 'admin.create', module: 'Admin', description: 'Create administrator accounts' },
  { name: 'admin.edit', module: 'Admin', description: 'Edit administrator settings' },
  { name: 'admin.delete', module: 'Admin', description: 'Delete administrator accounts' },
  { name: 'admin.permissions', module: 'Admin', description: 'Manage role permissions' },
  // Analytics
  { name: 'analytics.view', module: 'Analytics', description: 'Access overview dashboard metrics' },
  // Audit Logs
  {
    name: 'audit.view',
    module: 'Audit Logs',
    description: 'View immutable system activity audits',
  },
];

async function main() {
  console.log('Seeding database components...');
  const upsertedPermissions = [];
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
    upsertedPermissions.push(p);
  }
  console.log(`Upserted ${upsertedPermissions.length} permissions.`);

  console.log('Seeding roles...');
  // 1. Super Admin
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full system access with override capabilities',
      permissions: {
        connect: upsertedPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // 2. Admin
  // Gets all permissions except admin creation/deletion and subscription management
  const adminPermissions = upsertedPermissions.filter(
    (p) =>
      ![
        'admin.create',
        'admin.delete',
        'admin.permissions',
        'subscription.manage',
        'payment.refund',
      ].includes(p.name)
  );
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      permissions: {
        set: adminPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'Admin',
      description: 'Operations manager role with daily system controls',
      permissions: {
        connect: adminPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // 3. Moderator
  const moderatorPermissions = upsertedPermissions.filter((p) =>
    [
      'user.view',
      'tutor.view',
      'requirement.view',
      'report.view',
      'report.resolve',
      'content.edit',
    ].includes(p.name)
  );
  const moderatorRole = await prisma.role.upsert({
    where: { name: 'Moderator' },
    update: {
      permissions: {
        set: moderatorPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'Moderator',
      description: 'Content moderation and abuse reporting inspector',
      permissions: {
        connect: moderatorPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // 4. Support
  const supportPermissions = upsertedPermissions.filter((p) =>
    ['user.view', 'tutor.view', 'requirement.view', 'notification.send'].includes(p.name)
  );
  const supportRole = await prisma.role.upsert({
    where: { name: 'Support' },
    update: {
      permissions: {
        set: supportPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'Support',
      description: 'Customer service support agent workspace',
      permissions: {
        connect: supportPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  console.log('Seeding initial Super Admin user...');
  const adminPhone = '+919999999999';
  const superAdminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      email: 'superadmin@tutor.com',
      role: 'ADMIN',
      roleId: superAdminRole.id,
      passwordHash: hashPassword('SuperAdminSecurePassword123!'),
      isActive: true,
      isPhoneVerified: true,
    },
    create: {
      phone: adminPhone,
      email: 'superadmin@tutor.com',
      name: 'Super Admin',
      role: 'ADMIN',
      roleId: superAdminRole.id,
      passwordHash: hashPassword('SuperAdminSecurePassword123!'),
      isActive: true,
      isPhoneVerified: true,
    },
  });

  console.log('Super Admin user created successfully:', superAdminUser.email);
  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
