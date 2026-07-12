import {
  ApplicationStatus,
  NetworkType,
  PollSurveyQuestionType,
  PollSurveyStatus,
  PollSurveyType,
  PrismaClient,
  TrainingContentType,
  TrainingPublishStatus,
} from '@prisma/client';
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
      key: 'training',
      title: 'آموزش',
      description:
        'ماژول LMS سازمانی برای محتوای آموزشی، پیشرفت کاربران و دوره‌های حضوری.',
      icon: 'GraduationCap',
      route: '/admin/trainings',
      permission: 'training.manage',
      isCore: false,
      isEnabled: false,
      sortOrder: 10,
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
      sortOrder: 11,
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
      sortOrder: 12,
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
      sortOrder: 13,
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
      sortOrder: 14,
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
      sortOrder: 15,
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
      sortOrder: 16,
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
      sortOrder: 17,
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

  console.log('✅ Seed completed.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
