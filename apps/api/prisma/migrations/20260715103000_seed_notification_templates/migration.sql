INSERT INTO "public"."NotificationTemplate" (
  "id",
  "key",
  "title",
  "category",
  "status",
  "subject",
  "htmlBody",
  "textBody",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'tpl_general_message',
  'general-message',
  'پیام عمومی پرتال',
  'GENERAL',
  'PUBLISHED',
  '{{CompanyName}} - {{Title}}',
  '<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;"><div style="max-width:680px;margin:0 auto;border:1px solid rgba(34,211,238,.24);border-radius:22px;overflow:hidden;background:#0f172a;box-shadow:0 24px 80px rgba(8,145,178,.18);"><div style="padding:24px 28px;background:linear-gradient(135deg,rgba(8,145,178,.45),rgba(15,23,42,.96));border-bottom:1px solid rgba(34,211,238,.18);"><div style="font-size:12px;font-weight:800;color:#67e8f9;">AGTPS PORTAL</div><h1 style="margin:10px 0 0;font-size:24px;line-height:1.7;color:#fff;">{{Title}}</h1><div style="margin-top:8px;font-size:13px;color:#cbd5e1;">{{CompanyName}} · {{CurrentDate}}</div></div><div style="padding:28px;line-height:2;font-size:14px;color:#dbeafe;"><p>سلام {{UserName}}</p><p>{{Message}}</p><div style="margin-top:26px;"><a href="{{ButtonUrl}}" style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;border:1px solid rgba(103,232,249,.4);">{{ButtonText}}</a></div></div><div style="padding:18px 28px;border-top:1px solid rgba(148,163,184,.18);background:#0b1120;color:#94a3b8;font-size:12px;line-height:1.8;">این پیام به صورت خودکار از مرکز اعلان‌های AGTPS Portal ارسال شده است.<br />{{PortalUrl}}</div></div></div>',
  'سلام {{UserName}}\n\n{{Message}}\n\n{{PortalUrl}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'tpl_announcement_published',
  'announcement-published',
  'اطلاعیه جدید',
  'ANNOUNCEMENTS',
  'PUBLISHED',
  'اطلاعیه جدید: {{Title}}',
  '<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;"><div style="max-width:680px;margin:0 auto;border:1px solid rgba(34,211,238,.24);border-radius:22px;overflow:hidden;background:#0f172a;"><div style="padding:24px 28px;background:linear-gradient(135deg,rgba(8,145,178,.45),rgba(15,23,42,.96));"><div style="font-size:12px;font-weight:800;color:#67e8f9;">اطلاعیه سازمانی</div><h1 style="margin:10px 0 0;font-size:24px;color:#fff;">{{Title}}</h1><div style="margin-top:8px;font-size:13px;color:#cbd5e1;">{{CompanyName}} · {{CurrentDate}}</div></div><div style="padding:28px;line-height:2;color:#dbeafe;"><p>سلام {{UserName}}</p><p>یک اطلاعیه جدید در پرتال منتشر شده است.</p><div style="margin-top:16px;padding:16px;border-radius:16px;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.18);">{{Message}}</div><div style="margin-top:26px;"><a href="{{ButtonUrl}}" style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;">مشاهده اطلاعیه</a></div></div><div style="padding:18px 28px;border-top:1px solid rgba(148,163,184,.18);background:#0b1120;color:#94a3b8;font-size:12px;">AGTPS Portal Notification Center</div></div></div>',
  'اطلاعیه جدید: {{Title}}\n\n{{Message}}\n\n{{ButtonUrl}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'tpl_meeting_invite',
  'meeting-invite',
  'دعوت به جلسه',
  'MEETINGS',
  'PUBLISHED',
  'دعوت جلسه: {{Title}}',
  '<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;"><div style="max-width:680px;margin:0 auto;border:1px solid rgba(34,211,238,.24);border-radius:22px;overflow:hidden;background:#0f172a;"><div style="padding:24px 28px;background:linear-gradient(135deg,rgba(8,145,178,.45),rgba(15,23,42,.96));"><div style="font-size:12px;font-weight:800;color:#67e8f9;">تقویم جلسات</div><h1 style="margin:10px 0 0;font-size:24px;color:#fff;">{{Title}}</h1></div><div style="padding:28px;line-height:2;color:#dbeafe;"><p>سلام {{UserName}}</p><p>شما به جلسه زیر دعوت شده‌اید.</p><ul style="padding-right:20px;color:#cbd5e1;line-height:2;"><li>زمان: {{MeetingTime}}</li><li>مکان: {{Location}}</li></ul><p>{{Description}}</p><a href="{{ButtonUrl}}" style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;">مشاهده جلسه</a></div></div></div>',
  'دعوت جلسه: {{Title}}\nزمان: {{MeetingTime}}\nمکان: {{Location}}\n{{Description}}\n{{ButtonUrl}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'tpl_training_assigned',
  'training-assigned',
  'آموزش جدید',
  'TRAINING',
  'PUBLISHED',
  'آموزش جدید برای شما: {{Title}}',
  '<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;"><div style="max-width:680px;margin:0 auto;border:1px solid rgba(34,211,238,.24);border-radius:22px;overflow:hidden;background:#0f172a;"><div style="padding:24px 28px;background:linear-gradient(135deg,rgba(8,145,178,.45),rgba(15,23,42,.96));"><div style="font-size:12px;font-weight:800;color:#67e8f9;">آموزش سازمانی</div><h1 style="margin:10px 0 0;font-size:24px;color:#fff;">{{Title}}</h1></div><div style="padding:28px;line-height:2;color:#dbeafe;"><p>سلام {{UserName}}</p><p>یک محتوای آموزشی برای شما فعال شده است.</p><p>دسته: {{Category}}</p><p>مهلت: {{Deadline}}</p><a href="{{ButtonUrl}}" style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;">شروع آموزش</a></div></div></div>',
  'آموزش جدید: {{Title}}\nدسته: {{Category}}\nمهلت: {{Deadline}}\n{{ButtonUrl}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'tpl_poll_survey_reminder',
  'poll-survey-reminder',
  'یادآوری نظرسنجی و رای‌گیری',
  'POLLS',
  'PUBLISHED',
  'یادآوری مشارکت: {{Title}}',
  '<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;"><div style="max-width:680px;margin:0 auto;border:1px solid rgba(34,211,238,.24);border-radius:22px;overflow:hidden;background:#0f172a;"><div style="padding:24px 28px;background:linear-gradient(135deg,rgba(8,145,178,.45),rgba(15,23,42,.96));"><div style="font-size:12px;font-weight:800;color:#67e8f9;">مشارکت سازمانی</div><h1 style="margin:10px 0 0;font-size:24px;color:#fff;">{{Title}}</h1></div><div style="padding:28px;line-height:2;color:#dbeafe;"><p>سلام {{UserName}}</p><p>لطفا در نظرسنجی/رای‌گیری زیر شرکت کنید.</p><p>مهلت مشارکت: {{Deadline}}</p><p>{{Description}}</p><a href="{{ButtonUrl}}" style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;">ثبت پاسخ</a></div></div></div>',
  'یادآوری مشارکت: {{Title}}\nمهلت: {{Deadline}}\n{{Description}}\n{{ButtonUrl}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'tpl_backup_success',
  'backup-success',
  'بکاپ موفق',
  'BACKUPS',
  'PUBLISHED',
  'بکاپ AGTPS با موفقیت انجام شد',
  '<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;"><div style="max-width:680px;margin:0 auto;border:1px solid rgba(16,185,129,.28);border-radius:22px;overflow:hidden;background:#0f172a;"><div style="padding:24px 28px;background:linear-gradient(135deg,rgba(16,185,129,.35),rgba(15,23,42,.96));"><div style="font-size:12px;font-weight:800;color:#86efac;">Backup Center</div><h1 style="margin:10px 0 0;font-size:24px;color:#fff;">بکاپ با موفقیت انجام شد</h1></div><div style="padding:28px;line-height:2;color:#dbeafe;"><p>بکاپ زمان‌بندی‌شده با موفقیت ساخته شد.</p><ul style="padding-right:20px;color:#cbd5e1;line-height:2;"><li>زمان: {{BackupTime}}</li><li>حجم: {{BackupSize}}</li><li>مسیر: {{BackupPath}}</li></ul><a href="{{ButtonUrl}}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;">مشاهده بکاپ‌ها</a></div></div></div>',
  'بکاپ موفق\nزمان: {{BackupTime}}\nحجم: {{BackupSize}}\nمسیر: {{BackupPath}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'tpl_backup_failed',
  'backup-failed',
  'خطای بکاپ',
  'BACKUPS',
  'PUBLISHED',
  'خطا در بکاپ AGTPS',
  '<div dir="rtl" style="margin:0;background:#020617;color:#e5eefb;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px;"><div style="max-width:680px;margin:0 auto;border:1px solid rgba(244,63,94,.32);border-radius:22px;overflow:hidden;background:#0f172a;"><div style="padding:24px 28px;background:linear-gradient(135deg,rgba(244,63,94,.32),rgba(15,23,42,.96));"><div style="font-size:12px;font-weight:800;color:#fecdd3;">Backup Center</div><h1 style="margin:10px 0 0;font-size:24px;color:#fff;">بکاپ انجام نشد</h1></div><div style="padding:28px;line-height:2;color:#dbeafe;"><p>در اجرای بکاپ خطا رخ داده است.</p><div style="margin-top:16px;padding:16px;border-radius:16px;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.28);color:#fecdd3;">{{ErrorMessage}}</div><a href="{{ButtonUrl}}" style="display:inline-block;margin-top:24px;background:#e11d48;color:#fff;text-decoration:none;border-radius:14px;padding:12px 22px;font-weight:900;">بررسی خطا</a></div></div></div>',
  'خطای بکاپ\n{{ErrorMessage}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
  "title" = EXCLUDED."title",
  "category" = EXCLUDED."category",
  "status" = EXCLUDED."status",
  "subject" = EXCLUDED."subject",
  "htmlBody" = EXCLUDED."htmlBody",
  "textBody" = EXCLUDED."textBody",
  "updatedAt" = CURRENT_TIMESTAMP;
