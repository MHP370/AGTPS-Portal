import {
  ApplicationStatus,
  NetworkType,
  NotificationTemplateCategory,
  NotificationTemplateStatus,
  PollSurveyQuestionType,
  PollSurveyStatus,
  PollSurveyType,
  PrismaClient,
  SystemHealthCheckType,
  TrainingContentType,
  TrainingPublishStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function notificationTemplateHtml({
  eyebrow,
  title,
  body,
  buttonText = '{{ButtonText}}',
  buttonUrl = '{{ButtonUrl}}',
}: {
  eyebrow: string;
  title: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  return `
<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;">
  <div style="max-width:680px;margin:0 auto;border:1px solid rgba(34,211,238,.24);border-radius:22px;overflow:hidden;background:#0f172a;box-shadow:0 24px 80px rgba(8,145,178,.18);">
    <div style="padding:24px 28px;background:linear-gradient(135deg,rgba(8,145,178,.45),rgba(15,23,42,.96));border-bottom:1px solid rgba(34,211,238,.18);">
      <div style="font-size:12px;font-weight:800;color:#67e8f9;letter-spacing:.4px;">${eyebrow}</div>
      <h1 style="margin:10px 0 0;font-size:24px;line-height:1.7;color:#ffffff;">${title}</h1>
      <div style="margin-top:8px;font-size:13px;color:#cbd5e1;">{{CompanyName}} · {{CurrentDate}}</div>
    </div>
    <div style="padding:28px;line-height:2;font-size:14px;color:#dbeafe;">
      ${body}
      <div style="margin-top:26px;">
        <a href="${buttonUrl}" style="display:inline-block;background:#0891b2;color:#ffffff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;border:1px solid rgba(103,232,249,.4);">${buttonText}</a>
      </div>
    </div>
    <div style="padding:18px 28px;border-top:1px solid rgba(148,163,184,.18);background:#0b1120;color:#94a3b8;font-size:12px;line-height:1.8;">
      این پیام به صورت خودکار از مرکز اعلان‌های AGTPS Portal ارسال شده است.
      <br />
      {{PortalUrl}}
    </div>
  </div>
</div>`;
}

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
      name: 'file-shares.view',
      title: 'View File Shares',
    },
    {
      name: 'file-shares.manage',
      title: 'Manage File Shares',
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
      name: 'notification.view',
      title: 'View Notification Center',
    },
    {
      name: 'notification.manage',
      title: 'Manage Notification Center',
    },
    {
      name: 'notification.templates.manage',
      title: 'Manage Notification Templates',
    },
    {
      name: 'notification.smtp.manage',
      title: 'Manage Notification SMTP',
    },
    {
      name: 'notification.reports.view',
      title: 'View Notification Reports',
    },
    {
      name: 'backup.view',
      title: 'View Backups',
    },
    {
      name: 'backup.manage',
      title: 'Manage Backups',
    },
    {
      name: 'audit.view',
      title: 'View Audit Logs',
    },
    {
      name: 'ceo.messages.view',
      title: 'View Direct Communication',
    },
    {
      name: 'ceo.messages.reply',
      title: 'Reply Direct Communication',
    },
    {
      name: 'ceo.messages.manage',
      title: 'Manage Direct Communication',
    },
    {
      name: 'ceo.settings.manage',
      title: 'Manage Direct Communication Settings',
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
    {
      name: 'poll.view',
      title: 'مشاهده رای‌گیری‌ها',
    },
    {
      name: 'poll.manage',
      title: 'مدیریت رای‌گیری‌ها',
    },
    {
      name: 'poll.vote',
      title: 'شرکت در رای‌گیری‌ها',
    },
    {
      name: 'survey.view',
      title: 'مشاهده نظرسنجی‌ها',
    },
    {
      name: 'survey.manage',
      title: 'مدیریت نظرسنجی‌ها',
    },
    {
      name: 'survey.answer',
      title: 'پاسخ به نظرسنجی‌ها',
    },
    {
      name: 'reports.view',
      title: 'مشاهده گزارش‌ها',
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
      id: 'office-automation',
      title: 'اتوماسیون اداری',
      status: 'در دسترس',
      icon: 'MonitorCog',
      color: '#34d399',
      sortOrder: 1,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'external-mail-server',
      title: 'میل سرور خارج از شرکت',
      status: 'در دسترس',
      icon: 'Mail',
      color: '#38bdf8',
      sortOrder: 2,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'correspondence-automation',
      title: 'اتوماسیون نامه‌نگاری',
      status: 'در دسترس',
      icon: 'FileText',
      color: '#22d3ee',
      sortOrder: 3,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'food-reservation',
      title: 'رزرو غذا',
      status: 'در دسترس',
      icon: 'Utensils',
      color: '#f59e0b',
      sortOrder: 4,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'vpn-fortigate',
      title: 'VPN FortiGate',
      status: 'در دسترس',
      icon: 'ShieldCheck',
      color: '#a78bfa',
      sortOrder: 5,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'file-server',
      title: 'فایل شیر داخلی',
      status: 'در دسترس',
      icon: 'FileText',
      color: '#60a5fa',
      sortOrder: 6,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'business-intelligence',
      title: 'سامانه هوش تجاری',
      status: 'در دسترس',
      icon: 'Activity',
      color: '#2dd4bf',
      sortOrder: 7,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'management-dashboard-powerbi',
      title: 'داشبورد مدیریتی PowerBI',
      status: 'در دسترس',
      icon: 'PanelsTopLeft',
      color: '#facc15',
      sortOrder: 8,
      checkType: SystemHealthCheckType.MANUAL,
    },
    {
      id: 'maintenance-system',
      title: 'سامانه تعمیرات',
      status: 'در دسترس',
      icon: 'Settings',
      color: '#fb7185',
      sortOrder: 9,
      checkType: SystemHealthCheckType.MANUAL,
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
      description:
        'اسکلت مدیریت وضعیت سامانه‌ها؛ منطق مانیتورینگ بعدا تعریف می‌شود.',
      icon: 'Activity',
      route: '/admin/system-statuses',
      permission: 'system-statuses.manage',
      isCore: false,
      isEnabled: false,
      sortOrder: 9,
    },
    {
      key: 'file-shares',
      title: 'فایل شیر',
      description:
        'مرور امن فولدرهای شبکه و فایل‌های SMB بر اساس دسترسی کاربر و گروه.',
      icon: 'FolderOpen',
      route: '/admin/file-shares',
      permission: 'file-shares.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 10,
    },
    {
      key: 'training',
      title: 'آموزش',
      description:
        'ماژول LMS سازمانی برای محتوای آموزشی، پیشرفت کاربران و دوره‌های حضوری.',
      icon: 'GraduationCap',
      route: '/admin/trainings',
      permission: 'training.manage',
      isCore: false,
      isEnabled: false,
      sortOrder: 11,
    },
    {
      key: 'poll-survey',
      title: 'نظرسنجی و رای‌گیری',
      description:
        'مدیریت رای‌گیری‌ها، نظرسنجی‌ها، مشارکت اجباری، هدف‌گذاری و گزارش‌ها.',
      icon: 'Vote',
      route: '/admin/polls',
      permission: 'poll.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 12,
    },
    {
      key: 'notification-center',
      title: 'مرکز اعلان‌ها',
      description:
        'مدیریت SMTP، صف ارسال ایمیل، قالب‌ها و تاریخچه اعلان‌ها.',
      icon: 'BellRing',
      route: '/admin/notifications',
      permission: 'notification.view',
      isCore: false,
      isEnabled: true,
      sortOrder: 13,
    },
    {
      key: 'backup-center',
      title: 'مرکز بکاپ',
      description:
        'بکاپ دستی دیتابیس و فایل‌های مهم، دانلود امن و اعلان نتیجه بکاپ.',
      icon: 'DatabaseBackup',
      route: '/admin/backups',
      permission: 'backup.view',
      isCore: false,
      isEnabled: true,
      sortOrder: 14,
    },
    {
      key: 'direct-communication',
      title: 'ارتباط مستقیم مدیران',
      description:
        'تعریف مدیرعامل و مدیران بخش‌ها برای ارتباط مستقیم امن سازمانی.',
      icon: 'MessageSquareLock',
      route: '/admin/direct-communication',
      permission: 'ceo.settings.manage',
      isCore: false,
      isEnabled: true,
      sortOrder: 15,
    },
    {
      key: 'audit-logs',
      title: 'گزارش رویدادها',
      description:
        'ثبت عملیات حساس مدیریتی و امنیتی بدون نگهداری محتوای محرمانه.',
      icon: 'ScrollText',
      route: '/admin/audit-logs',
      permission: 'audit.view',
      isCore: false,
      isEnabled: true,
      sortOrder: 16,
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
      sortOrder: 17,
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
      sortOrder: 18,
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
      sortOrder: 19,
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
      sortOrder: 20,
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
      sortOrder: 21,
    },
    {
      key: 'modules',
      title: 'ماژول‌ها',
      description:
        'فعال‌سازی، غیرفعال‌سازی و مدیریت نصب منطقی ماژول‌های پرتال.',
      icon: 'Puzzle',
      route: '/admin/modules',
      permission: 'modules.manage',
      isCore: true,
      isEnabled: true,
      sortOrder: 22,
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

  const trainingCategorySeeds = [
    {
      name: 'فناوری اطلاعات',
      slug: 'it',
      description: 'آموزش‌های سامانه‌ها، امنیت، شبکه و ابزارهای IT.',
      color: '#22d3ee',
      icon: 'Database',
      sortOrder: 1,
    },
    {
      name: 'HSE',
      slug: 'hse',
      description: 'آموزش‌های ایمنی، بهداشت و محیط زیست.',
      color: '#34d399',
      icon: 'ShieldCheck',
      sortOrder: 2,
    },
    {
      name: 'منابع انسانی',
      slug: 'hr',
      description: 'آموزش‌های منابع انسانی، اداری و فرهنگ سازمانی.',
      color: '#a78bfa',
      icon: 'Users',
      sortOrder: 3,
    },
    {
      name: 'عمومی',
      slug: 'general-training',
      description: 'آموزش‌های عمومی قابل استفاده برای همه کارکنان.',
      color: '#f59e0b',
      icon: 'GraduationCap',
      sortOrder: 4,
    },
  ];

  const trainingCategories = await Promise.all(
    trainingCategorySeeds.map((category) =>
      prisma.trainingCategory.upsert({
        where: {
          slug: category.slug,
        },
        update: category,
        create: category,
      }),
    ),
  );
  const generalTrainingCategory = trainingCategories.find(
    (category) => category.slug === 'general-training',
  );

  await prisma.trainingItem.upsert({
    where: {
      slug: 'portal-introduction',
    },
    update: {
      title: 'معرفی پورتال سازمانی',
      description:
        'محتوای نمونه برای شروع ماژول آموزش. فایل واقعی بعدا از پنل یا SMB اضافه می‌شود.',
      categoryId: generalTrainingCategory?.id,
      contentType: TrainingContentType.LINK,
      sourceType: 'PORTAL_UPLOAD',
      externalUrl: '#',
      instructor: 'واحد فناوری اطلاعات',
      department: 'عمومی',
      level: 'مقدماتی',
      durationMinutes: 15,
      tags: ['پورتال', 'عمومی'],
      isRequired: false,
      status: TrainingPublishStatus.DRAFT,
      isActive: true,
    },
    create: {
      title: 'معرفی پورتال سازمانی',
      slug: 'portal-introduction',
      description:
        'محتوای نمونه برای شروع ماژول آموزش. فایل واقعی بعدا از پنل یا SMB اضافه می‌شود.',
      categoryId: generalTrainingCategory?.id,
      contentType: TrainingContentType.LINK,
      sourceType: 'PORTAL_UPLOAD',
      externalUrl: '#',
      instructor: 'واحد فناوری اطلاعات',
      department: 'عمومی',
      level: 'مقدماتی',
      durationMinutes: 15,
      tags: ['پورتال', 'عمومی'],
      isRequired: false,
      status: TrainingPublishStatus.DRAFT,
      isActive: true,
    },
  });

  await prisma.trainingSource.upsert({
    where: {
      id: 'default-training-share',
    },
    update: {
      name: 'فایل‌سرور آموزش',
      type: 'SMB',
      basePath: '/mnt/agtps-training',
      description:
        'مسیر نمونه برای فایل‌های آموزشی قبلی. sync واقعی بعد از مشخص شدن مسیر و دسترسی شبکه فعال می‌شود.',
      isActive: false,
    },
    create: {
      id: 'default-training-share',
      name: 'فایل‌سرور آموزش',
      type: 'SMB',
      basePath: '/mnt/agtps-training',
      description:
        'مسیر نمونه برای فایل‌های آموزشی قبلی. sync واقعی بعد از مشخص شدن مسیر و دسترسی شبکه فعال می‌شود.',
      isActive: false,
    },
  });

  const samplePoll = await prisma.pollSurvey.upsert({
    where: {
      id: 'sample-required-poll',
    },
    update: {
      title: 'رای‌گیری نمونه انتخاب اولویت پرتال',
      description:
        'نمونه اولیه برای تست موتور رای‌گیری. بعد از نهایی شدن می‌توانید حذف یا آرشیو کنید.',
      type: PollSurveyType.POLL,
      category: 'عمومی',
      anonymous: false,
      required: false,
      allowMultipleSelection: false,
      allowResultViewing: true,
      allowParticipantCount: true,
      allowLiveResults: true,
      status: PollSurveyStatus.RUNNING,
    },
    create: {
      id: 'sample-required-poll',
      title: 'رای‌گیری نمونه انتخاب اولویت پرتال',
      description:
        'نمونه اولیه برای تست موتور رای‌گیری. بعد از نهایی شدن می‌توانید حذف یا آرشیو کنید.',
      type: PollSurveyType.POLL,
      category: 'عمومی',
      anonymous: false,
      required: false,
      allowMultipleSelection: false,
      allowResultViewing: true,
      allowParticipantCount: true,
      allowLiveResults: true,
      status: PollSurveyStatus.RUNNING,
    },
  });

  const samplePollQuestion = await prisma.pollSurveyQuestion.upsert({
    where: {
      id: 'sample-required-poll-question',
    },
    update: {
      title: 'کدام بخش پرتال برای شما اولویت بیشتری دارد؟',
      type: PollSurveyQuestionType.SINGLE_CHOICE,
      isRequired: true,
      sortOrder: 1,
      pollSurveyId: samplePoll.id,
    },
    create: {
      id: 'sample-required-poll-question',
      title: 'کدام بخش پرتال برای شما اولویت بیشتری دارد؟',
      type: PollSurveyQuestionType.SINGLE_CHOICE,
      isRequired: true,
      sortOrder: 1,
      pollSurveyId: samplePoll.id,
    },
  });

  const samplePollOptions = await Promise.all(
    ['سامانه‌ها', 'آموزش', 'جلسات', 'دانلودها'].map((label, index) =>
      prisma.pollSurveyOption.upsert({
        where: {
          id: `sample-required-poll-option-${index + 1}`,
        },
        update: {
          label,
          sortOrder: index + 1,
          questionId: samplePollQuestion.id,
        },
        create: {
          id: `sample-required-poll-option-${index + 1}`,
          label,
          sortOrder: index + 1,
          questionId: samplePollQuestion.id,
        },
      }),
    ),
  );

  const samplePollResponses = [
    {
      id: 'sample-required-poll-response-1',
      participantHash: 'sample-required-poll-participant-1',
      optionId: samplePollOptions[0]?.id,
      submittedAt: new Date('2026-07-09T08:30:00.000Z'),
    },
    {
      id: 'sample-required-poll-response-2',
      participantHash: 'sample-required-poll-participant-2',
      optionId: samplePollOptions[1]?.id,
      submittedAt: new Date('2026-07-10T09:15:00.000Z'),
    },
    {
      id: 'sample-required-poll-response-3',
      participantHash: 'sample-required-poll-participant-3',
      optionId: samplePollOptions[0]?.id,
      submittedAt: new Date('2026-07-10T12:45:00.000Z'),
    },
    {
      id: 'sample-required-poll-response-4',
      participantHash: 'sample-required-poll-participant-4',
      optionId: samplePollOptions[2]?.id,
      submittedAt: new Date('2026-07-11T07:20:00.000Z'),
    },
  ];

  await Promise.all(
    samplePollResponses.map(async (response) => {
      if (!response.optionId) return;

      const savedResponse = await prisma.pollSurveyResponse.upsert({
        where: {
          pollSurveyId_participantHash: {
            pollSurveyId: samplePoll.id,
            participantHash: response.participantHash,
          },
        },
        update: {
          status: 'SUBMITTED',
          submittedAt: response.submittedAt,
          isAnonymous: false,
        },
        create: {
          id: response.id,
          pollSurveyId: samplePoll.id,
          participantHash: response.participantHash,
          status: 'SUBMITTED',
          submittedAt: response.submittedAt,
          isAnonymous: false,
        },
      });

      await prisma.pollSurveyAnswer.upsert({
        where: {
          id: `${response.id}-answer`,
        },
        update: {
          responseId: savedResponse.id,
          questionId: samplePollQuestion.id,
          optionId: response.optionId,
        },
        create: {
          id: `${response.id}-answer`,
          responseId: savedResponse.id,
          questionId: samplePollQuestion.id,
          optionId: response.optionId,
        },
      });
    }),
  );

  const sampleSurvey = await prisma.pollSurvey.upsert({
    where: {
      id: 'sample-employee-survey',
    },
    update: {
      title: 'نظرسنجی نمونه رضایت کاربران',
      description: 'نمونه اولیه برای تست موتور نظرسنجی سازمانی.',
      type: PollSurveyType.SURVEY,
      category: 'بازخورد',
      anonymous: true,
      required: false,
      status: PollSurveyStatus.DRAFT,
    },
    create: {
      id: 'sample-employee-survey',
      title: 'نظرسنجی نمونه رضایت کاربران',
      description: 'نمونه اولیه برای تست موتور نظرسنجی سازمانی.',
      type: PollSurveyType.SURVEY,
      category: 'بازخورد',
      anonymous: true,
      required: false,
      status: PollSurveyStatus.DRAFT,
    },
  });

  await prisma.pollSurveyQuestion.upsert({
    where: {
      id: 'sample-employee-survey-question-1',
    },
    update: {
      title: 'رضایت کلی شما از پرتال چقدر است؟',
      type: PollSurveyQuestionType.RATING,
      isRequired: true,
      sortOrder: 1,
      settings: {
        min: 1,
        max: 5,
      },
      pollSurveyId: sampleSurvey.id,
    },
    create: {
      id: 'sample-employee-survey-question-1',
      title: 'رضایت کلی شما از پرتال چقدر است؟',
      type: PollSurveyQuestionType.RATING,
      isRequired: true,
      sortOrder: 1,
      settings: {
        min: 1,
        max: 5,
      },
      pollSurveyId: sampleSurvey.id,
    },
  });

  const notificationTemplates = [
    {
      key: 'general-message',
      title: 'پیام عمومی پرتال',
      category: NotificationTemplateCategory.GENERAL,
      subject: '{{CompanyName}} - {{Title}}',
      htmlBody: notificationTemplateHtml({
        eyebrow: 'AGTPS PORTAL',
        title: '{{Title}}',
        body: '<p>سلام {{UserName}}</p><p>{{Message}}</p>',
      }),
      textBody: 'سلام {{UserName}}\n\n{{Message}}\n\n{{PortalUrl}}',
    },
    {
      key: 'announcement-published',
      title: 'اطلاعیه جدید',
      category: NotificationTemplateCategory.ANNOUNCEMENTS,
      subject: 'اطلاعیه جدید: {{Title}}',
      htmlBody: notificationTemplateHtml({
        eyebrow: 'اطلاعیه سازمانی',
        title: '{{Title}}',
        body:
          '<p>سلام {{UserName}}</p><p>یک اطلاعیه جدید در پرتال منتشر شده است.</p><div style="margin-top:16px;padding:16px;border-radius:16px;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.18);">{{Message}}</div>',
        buttonText: 'مشاهده اطلاعیه',
      }),
      textBody: 'اطلاعیه جدید: {{Title}}\n\n{{Message}}\n\n{{ButtonUrl}}',
    },
    {
      key: 'meeting-invite',
      title: 'دعوت به جلسه',
      category: NotificationTemplateCategory.MEETINGS,
      subject: 'دعوت جلسه: {{Title}}',
      htmlBody: notificationTemplateHtml({
        eyebrow: 'تقویم جلسات',
        title: '{{Title}}',
        body:
          '<p>سلام {{UserName}}</p><p>شما به جلسه زیر دعوت شده‌اید.</p><ul style="padding-right:20px;color:#cbd5e1;line-height:2;"><li>زمان: {{MeetingTime}}</li><li>مکان: {{Location}}</li></ul><p>{{Description}}</p>',
        buttonText: 'مشاهده جلسه',
      }),
      textBody:
        'دعوت جلسه: {{Title}}\nزمان: {{MeetingTime}}\nمکان: {{Location}}\n{{Description}}\n{{ButtonUrl}}',
    },
    {
      key: 'training-assigned',
      title: 'آموزش جدید',
      category: NotificationTemplateCategory.TRAINING,
      subject: 'آموزش جدید برای شما: {{Title}}',
      htmlBody: notificationTemplateHtml({
        eyebrow: 'آموزش سازمانی',
        title: '{{Title}}',
        body:
          '<p>سلام {{UserName}}</p><p>یک محتوای آموزشی برای شما فعال شده است.</p><p>دسته: {{Category}}</p><p>مهلت: {{Deadline}}</p>',
        buttonText: 'شروع آموزش',
      }),
      textBody:
        'آموزش جدید: {{Title}}\nدسته: {{Category}}\nمهلت: {{Deadline}}\n{{ButtonUrl}}',
    },
    {
      key: 'poll-survey-reminder',
      title: 'یادآوری نظرسنجی و رای‌گیری',
      category: NotificationTemplateCategory.POLLS,
      subject: 'یادآوری مشارکت: {{Title}}',
      htmlBody: notificationTemplateHtml({
        eyebrow: 'مشارکت سازمانی',
        title: '{{Title}}',
        body:
          '<p>سلام {{UserName}}</p><p>لطفا در نظرسنجی/رای‌گیری زیر شرکت کنید.</p><p>مهلت مشارکت: {{Deadline}}</p><p>{{Description}}</p>',
        buttonText: 'ثبت پاسخ',
      }),
      textBody:
        'یادآوری مشارکت: {{Title}}\nمهلت: {{Deadline}}\n{{Description}}\n{{ButtonUrl}}',
    },
    {
      key: 'backup-success',
      title: 'بکاپ موفق',
      category: NotificationTemplateCategory.BACKUPS,
      subject: 'بکاپ AGTPS با موفقیت انجام شد',
      htmlBody: notificationTemplateHtml({
        eyebrow: 'Backup Center',
        title: 'بکاپ با موفقیت انجام شد',
        body:
          '<p>بکاپ زمان‌بندی‌شده با موفقیت ساخته شد.</p><ul style="padding-right:20px;color:#cbd5e1;line-height:2;"><li>زمان: {{BackupTime}}</li><li>حجم: {{BackupSize}}</li><li>مسیر: {{BackupPath}}</li></ul>',
        buttonText: 'مشاهده بکاپ‌ها',
      }),
      textBody:
        'بکاپ موفق\nزمان: {{BackupTime}}\nحجم: {{BackupSize}}\nمسیر: {{BackupPath}}',
    },
    {
      key: 'backup-failed',
      title: 'خطای بکاپ',
      category: NotificationTemplateCategory.BACKUPS,
      subject: 'خطا در بکاپ AGTPS',
      htmlBody: notificationTemplateHtml({
        eyebrow: 'Backup Center',
        title: 'بکاپ انجام نشد',
        body:
          '<p>در اجرای بکاپ خطا رخ داده است.</p><div style="margin-top:16px;padding:16px;border-radius:16px;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.28);color:#fecdd3;">{{ErrorMessage}}</div>',
        buttonText: 'بررسی خطا',
      }),
      textBody: 'خطای بکاپ\n{{ErrorMessage}}',
    },
  ];

  await Promise.all(
    notificationTemplates.map((template) =>
      prisma.notificationTemplate.upsert({
        where: {
          key: template.key,
        },
        update: {
          title: template.title,
          category: template.category,
          status: NotificationTemplateStatus.PUBLISHED,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
        },
        create: {
          ...template,
          status: NotificationTemplateStatus.PUBLISHED,
        },
      }),
    ),
  );

  const templateByKey = new Map(
    (
      await prisma.notificationTemplate.findMany({
        where: {
          key: {
            in: notificationTemplates.map((template) => template.key),
          },
        },
        select: {
          id: true,
          key: true,
        },
      })
    ).map((template) => [template.key, template.id]),
  );

  const notificationRules = [
    {
      eventKey: 'announcement.published',
      title: 'انتشار اطلاعیه',
      description: 'هنگام انتشار اطلاعیه جدید',
      moduleKey: 'announcements',
      portalEnabled: true,
      emailEnabled: false,
      templateKey: 'announcement-published',
      priority: 50,
    },
    {
      eventKey: 'meeting.invite',
      title: 'دعوت به جلسه',
      description: 'هنگام ایجاد جلسه و دعوت اعضا',
      moduleKey: 'meetings',
      portalEnabled: true,
      emailEnabled: true,
      templateKey: 'meeting-invite',
      priority: 20,
    },
    {
      eventKey: 'meeting.update',
      title: 'به‌روزرسانی جلسه',
      description: 'هنگام ویرایش اعضا یا اطلاعات جلسه',
      moduleKey: 'meetings',
      portalEnabled: true,
      emailEnabled: true,
      templateKey: 'meeting-invite',
      priority: 30,
    },
    {
      eventKey: 'workspace.reminder',
      title: 'یادآوری شخصی',
      description: 'هنگام رسیدن زمان یادآوری کاربر',
      moduleKey: 'workspace',
      portalEnabled: true,
      emailEnabled: false,
      templateKey: 'general-message',
      priority: 40,
    },
    {
      eventKey: 'workspace.task',
      title: 'یادآوری تسک',
      description: 'هنگام رسیدن موعد تسک کاربر',
      moduleKey: 'workspace',
      portalEnabled: true,
      emailEnabled: false,
      templateKey: 'general-message',
      priority: 40,
    },
    {
      eventKey: 'backup.result',
      title: 'نتیجه بکاپ',
      description: 'هنگام موفق یا ناموفق شدن بکاپ دستی و خودکار',
      moduleKey: 'backup-center',
      portalEnabled: false,
      emailEnabled: true,
      templateKey: 'backup-success',
      priority: 15,
    },
  ];

  await Promise.all(
    notificationRules.map((rule) =>
      prisma.notificationRule.upsert({
        where: {
          eventKey: rule.eventKey,
        },
        update: {
          title: rule.title,
          description: rule.description,
          moduleKey: rule.moduleKey,
          portalEnabled: rule.portalEnabled,
          emailEnabled: rule.emailEnabled,
          emailTemplateId: templateByKey.get(rule.templateKey),
          priority: rule.priority,
          isActive: true,
        },
        create: {
          eventKey: rule.eventKey,
          title: rule.title,
          description: rule.description,
          moduleKey: rule.moduleKey,
          portalEnabled: rule.portalEnabled,
          emailEnabled: rule.emailEnabled,
          emailTemplateId: templateByKey.get(rule.templateKey),
          priority: rule.priority,
          isActive: true,
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
