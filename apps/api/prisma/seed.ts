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
    name: 'categories.manage',
    title: 'Manage Categories',
  },
  {
    name: 'sites.manage',
    title: 'Manage Sites',
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
    name: 'directory.manage',
    title: 'Manage Directory',
  },
  {
    name: 'access.manage',
    title: 'Manage Access',
  },
  {
    name: 'settings.manage',
    title: 'Manage Settings',
  },
  {
    name: 'sliders.manage',
    title: 'Manage Sliders',
  },
  {
    name: 'downloads.manage',
    title: 'Manage Downloads',
  },
  {
    name: 'system-statuses.manage',
    title: 'Manage System Statuses',
  },
  {
    name: 'modules.manage',
    title: 'Manage Portal Modules',
  },
  {
    name: 'training.view',
    title: 'View Training',
  },
  {
    name: 'training.manage',
    title: 'Manage Training',
  },
  {
    name: 'training.publish',
    title: 'Publish Training',
  },
  {
    name: 'training.delete',
    title: 'Delete Training',
  },
  {
    name: 'training.feedback.manage',
    title: 'Manage Training Feedback',
  },
  {
    name: 'training.history.view',
    title: 'View Training History',
  },
  {
    name: 'training.history.manage',
    title: 'Manage Training History',
  },
  {
    name: 'training.course.manage',
    title: 'Manage Training Courses',
  },
  {
    name: 'training.reports.view',
    title: 'View Training Reports',
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

  const systemStatusSeeds = [
    {
      id: 'internet',
      title: 'اینترنت',
      status: 'متصل',
      icon: 'CheckCircle2',
      color: '#34d399',
      sortOrder: 1,
    },
    {
      id: 'vpn',
      title: 'VPN',
      status: 'متصل',
      icon: 'ShieldCheck',
      color: '#38bdf8',
      sortOrder: 2,
    },
    {
      id: 'erp',
      title: 'سامانه ERP',
      status: 'در دسترس',
      icon: 'Database',
      color: '#22d3ee',
      sortOrder: 3,
    },
    {
      id: 'finance',
      title: 'سامانه مالی',
      status: 'در دسترس',
      icon: 'WalletCards',
      color: '#f59e0b',
      sortOrder: 4,
    },
    {
      id: 'mail',
      title: 'ایمیل سازمانی',
      status: 'در دسترس',
      icon: 'Mail',
      color: '#a78bfa',
      sortOrder: 5,
    },
    {
      id: 'file-server',
      title: 'سرور فایل',
      status: 'در دسترس',
      icon: 'FileText',
      color: '#60a5fa',
      sortOrder: 6,
    },
  ];

  await Promise.all(
    systemStatusSeeds.map((status) =>
      prisma.systemStatus.upsert({
        where: {
          id: status.id,
        },
        update: status,
        create: status,
      }),
    ),
  );

  const moduleSeeds = [
    {
      key: 'dashboard',
      title: 'داشبورد',
      description: 'نمای کلی پنل مدیریت و وضعیت پرتال.',
      icon: 'House',
      route: '/admin/dashboard',
      permission: null,
      isCore: true,
      isEnabled: true,
      sortOrder: 1,
    },
    {
      key: 'applications',
      title: 'سامانه‌ها',
      description: 'مدیریت سامانه‌ها و لینک‌های داخلی سازمان.',
      icon: 'Database',
      route: '/admin/applications',
      permission: 'applications.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 2,
    },
    {
      key: 'categories',
      title: 'دسته‌بندی‌ها',
      description: 'مدیریت دسته‌بندی سامانه‌ها و آیکن‌ها.',
      icon: 'FolderTree',
      route: '/admin/categories',
      permission: 'categories.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 3,
    },
    {
      key: 'sites',
      title: 'سایت‌ها',
      description: 'مدیریت سایت‌ها و موقعیت‌های سازمان روی نقشه.',
      icon: 'MapPin',
      route: '/admin/sites',
      permission: 'sites.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 4,
    },
    {
      key: 'news',
      title: 'اخبار',
      description: 'انتشار اخبار سازمانی در پرتال.',
      icon: 'FileText',
      route: '/admin/news',
      permission: 'news.publish',
      isCore: false,
      isEnabled: true,
      sortOrder: 5,
    },
    {
      key: 'meetings',
      title: 'جلسات',
      description: 'تقویم جلسات، دعوت اعضا و نوتیفیکیشن.',
      icon: 'CalendarDays',
      route: '/admin/meetings',
      permission: 'meetings.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 6,
    },
    {
      key: 'workspace',
      title: 'فضای کاری',
      description: 'یادداشت‌ها، تسک‌ها و یادآوری‌های شخصی.',
      icon: 'BriefcaseBusiness',
      route: '/admin/workspace',
      permission: null,
      isCore: false,
      isEnabled: true,
      sortOrder: 7,
    },
    {
      key: 'downloads',
      title: 'دانلودها',
      description: 'مدیریت فایل‌ها، نرم‌افزارها و لینک‌های دانلود.',
      icon: 'CloudDownload',
      route: '/admin/downloads',
      permission: 'downloads.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 8,
    },
    {
      key: 'system-statuses',
      title: 'وضعیت سیستم‌ها',
      description: 'اسکلت مدیریت وضعیت سامانه‌ها؛ منطق مانیتورینگ بعدا تعریف می‌شود.',
      icon: 'Activity',
      route: '/admin/system-statuses',
      permission: 'system-statuses.manage',
      isCore: false,
      isEnabled: false,
      sortOrder: 9,
    },
    {
      key: 'training',
      title: 'آموزش',
      description: 'ماژول LMS سازمانی برای محتوای آموزشی، پیشرفت کاربران و دوره‌های حضوری.',
      icon: 'GraduationCap',
      route: '/admin/trainings',
      permission: 'training.manage',
      isCore: false,
      isEnabled: false,
      sortOrder: 10,
    },
    {
      key: 'directory',
      title: 'اکتیو دایرکتوری',
      description: 'تنظیمات و همگام‌سازی کاربران و گروه‌های سازمانی.',
      icon: 'Network',
      route: '/admin/directory',
      permission: 'directory.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 11,
    },
    {
      key: 'access',
      title: 'دسترسی‌ها',
      description: 'مدیریت نقش‌ها، permissionها و سطح دسترسی.',
      icon: 'ShieldCheck',
      route: '/admin/access',
      permission: 'access.manage',
      isCore: true,
      isEnabled: true,
      sortOrder: 12,
    },
    {
      key: 'announcements',
      title: 'اطلاعیه‌ها',
      description: 'مدیریت اطلاعیه‌های زمان‌دار و اولویت‌دار.',
      icon: 'Bell',
      route: '/admin/announcements',
      permission: 'announcements.publish',
      isCore: false,
      isEnabled: true,
      sortOrder: 13,
    },
    {
      key: 'sliders',
      title: 'اسلایدر',
      description: 'مدیریت اسلایدهای صفحه اصلی پرتال.',
      icon: 'PanelsTopLeft',
      route: '/admin/sliders',
      permission: 'sliders.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 14,
    },
    {
      key: 'settings',
      title: 'تنظیمات',
      description: 'تنظیمات عمومی، ظاهر پرتال، ویجت‌ها و اکتیو دایرکتوری.',
      icon: 'Settings',
      route: '/admin/settings',
      permission: 'settings.manage',
      isCore: true,
      isEnabled: true,
      sortOrder: 15,
    },
    {
      key: 'modules',
      title: 'ماژول‌ها',
      description: 'فعال‌سازی، غیرفعال‌سازی و مدیریت نصب منطقی ماژول‌های پرتال.',
      icon: 'Puzzle',
      route: '/admin/modules',
      permission: 'modules.manage',
      isCore: true,
      isEnabled: true,
      sortOrder: 16,
    },
  ];

  await Promise.all(
    moduleSeeds.map((module) =>
      prisma.portalModule.upsert({
        where: {
          key: module.key,
        },
        update: {
          title: module.title,
          description: module.description,
          icon: module.icon,
          route: module.route,
          permission: module.permission,
          isCore: module.isCore,
          sortOrder: module.sortOrder,
        },
        create: module,
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
