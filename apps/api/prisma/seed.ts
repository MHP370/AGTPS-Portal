import { PrismaClient, ApplicationStatus, NetworkType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin@123', 10);

  // Admin
  const adminUser = await prisma.user.upsert({
    where: {
      username: 'admin',
    },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@agtps.local',
      password,
      firstName: 'System',
      lastName: 'Administrator',
    },
  });

  await prisma.directoryUser.upsert({
    where: {
      username: 'admin',
    },
    update: {
      displayName: 'مدیر سیستم',
      email: 'admin@agtps.local',
      department: 'فناوری اطلاعات',
      title: 'مدیر سامانه',
      source: 'INTERNAL',
      isActive: true,
    },
    create: {
      username: 'admin',
      displayName: 'مدیر سیستم',
      email: 'admin@agtps.local',
      department: 'فناوری اطلاعات',
      title: 'مدیر سامانه',
      source: 'INTERNAL',
    },
  });
  
  // Roles
const adminRole = await prisma.role.upsert({
  where: {
    name: 'admin',
  },
  update: {},
  create: {
    name: 'admin',
    title: 'Administrator',
  },
});

// Permissions
const permissionDefinitions = [
  {
    name: 'applications.manage',
    title: 'Manage Applications',
  },
  {
    name: 'news.publish',
    title: 'Publish News',
  },
  {
    name: 'announcements.publish',
    title: 'Publish Announcements',
  },
  {
    name: 'meetings.manage',
    title: 'Manage Meetings',
  },
  {
    name: 'users.manage',
    title: 'Manage Users',
  },
  {
    name: 'downloads.manage',
    title: 'Manage Downloads',
  },
];

const permissions = await Promise.all(
  permissionDefinitions.map((permission) =>
    prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: {
        title: permission.title,
      },
      create: permission,
    }),
  ),
);

// Assign role to admin
await prisma.userRole.upsert({
  where: {
    userId_roleId: {
      userId: (
        await prisma.user.findUniqueOrThrow({
          where: { username: 'admin' },
        })
      ).id,
      roleId: adminRole.id,
    },
  },
  update: {},
  create: {
    userId: adminUser.id,
    roleId: adminRole.id,
  },
});

// Assign permissions to role
await Promise.all(
  permissions.map((permission) =>
    prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    }),
  ),
);


  // Sites
  const tehran = await prisma.site.upsert({
    where: {
      code: 'TEH',
    },
    update: {},
    create: {
      code: 'TEH',
      name: 'تهران',
      sortOrder: 1,
    },
  });

  const asaluyeh = await prisma.site.upsert({
    where: {
      code: 'ASL',
    },
    update: {},
    create: {
      code: 'ASL',
      name: 'عسلویه',
      sortOrder: 2,
    },
  });

  // Category
  const category = await prisma.applicationCategory.upsert({
    where: {
      slug: 'general',
    },
    update: {},
    create: {
      name: 'عمومی',
      slug: 'general',
      sortOrder: 1,
    },
  });

  // ERP Application
  const erp = await prisma.application.upsert({
    where: {
      key: 'ERP',
    },
    update: {},
    create: {
      key: 'ERP',
      slug: 'erp',
      title: 'راهکاران',
      description: 'سامانه ERP',
      categoryId: category.id,
      icon: 'Building2',
      color: '#0F766E',
      status: ApplicationStatus.ACTIVE,
      networkType: NetworkType.INTRANET,
      sortOrder: 1,
    },
  });

  // ERP Tehran
  await prisma.applicationSite.upsert({
    where: {
      applicationId_siteId: {
        applicationId: erp.id,
        siteId: tehran.id,
      },
    },
    update: {},
    create: {
      applicationId: erp.id,
      siteId: tehran.id,
      url: 'http://erp.agtps.net',
    },
  });

  // ERP Asaluyeh
  await prisma.applicationSite.upsert({
    where: {
      applicationId_siteId: {
        applicationId: erp.id,
        siteId: asaluyeh.id,
      },
    },
    update: {},
    create: {
      applicationId: erp.id,
      siteId: asaluyeh.id,
      url: 'http://erp.agtps.net',
    },
  });

  const downloadSeeds = [
    {
      title: 'Google Chrome',
      version: 'نسخه سازمانی',
      fileUrl: 'https://www.google.com/chrome/',
      category: 'مرورگر',
      icon: 'Globe',
      color: 'text-emerald-300',
      sortOrder: 1,
    },
    {
      title: 'AnyDesk',
      version: 'نسخه پشتیبانی',
      fileUrl: 'https://anydesk.com/',
      category: 'پشتیبانی',
      icon: 'Plane',
      color: 'text-rose-300',
      sortOrder: 2,
    },
    {
      title: 'FortiClient VPN',
      version: 'VPN',
      fileUrl: 'https://www.fortinet.com/support/product-downloads',
      category: 'شبکه',
      icon: 'ShieldCheck',
      color: 'text-sky-300',
      sortOrder: 3,
    },
    {
      title: 'Microsoft Office',
      version: 'نسخه 2021',
      fileUrl: 'https://www.office.com/',
      category: 'اداری',
      icon: 'BriefcaseBusiness',
      color: 'text-orange-300',
      sortOrder: 4,
    },
  ];

  await Promise.all(
    downloadSeeds.map((download) =>
      prisma.portalDownload.upsert({
        where: {
          id: download.title,
        },
        update: download,
        create: {
          id: download.title,
          ...download,
        },
      }),
    ),
  );

  console.log('✅ Seed completed.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
