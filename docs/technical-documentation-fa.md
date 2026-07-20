# مستند فنی AGTPS Portal

این فایل مستند فنی زنده پروژه است. از این مرحله به بعد، هر ماژول یا فاز تکمیل‌شده باید در همین فایل یا فایل فنی اختصاصی خودش به‌روزرسانی شود.

## قوانین نگهداری مستند

- هر تغییر نهایی‌شده باید در راهنمای فارسی کاربر/ادمین ثبت شود.
- هر تغییر نهایی‌شده باید در مستند فنی ثبت شود.
- مستند فنی باید شامل مسیرهای API، مسیرهای UI، permissionها، تنظیمات مهم، migrationها و ملاحظات امنیتی باشد.
- اگر بخشی هنوز برای فاز بعدی باقی مانده، باید صریحا در قسمت «فاز بعدی» نوشته شود.

## ماژول ارتباط مستقیم مدیران

### هدف

این ماژول برای ارتباط مستقیم کاربران با مدیرعامل و مدیران بخش‌ها استفاده می‌شود. تنظیمات مدیریتی از ارسال و مشاهده پیام جدا شده است.

### مسیرهای UI

- `/admin/direct-messages`
  - قابل استفاده برای همه کاربران لاگین‌کرده.
  - کاربران عادی از این صفحه پیام ارسال می‌کنند.
  - کاربران عادی فقط پیام‌های ارسالی خودشان را می‌بینند.
  - مدیران و مدیرعامل علاوه بر پیام‌های ارسالی خودشان، پیام‌های دریافتی مربوط به خودشان را می‌بینند.

- `/admin/direct-communication`
  - فقط برای ادمین یا کاربر دارای `ceo.settings.manage`.
  - برای تعریف مدیرعامل، مدیران بخش‌ها و کلمات ممنوعه استفاده می‌شود.

- `/`
  - صفحه اصلی پورتال نباید ویجت یا لیست پیام‌های ارتباط مستقیم را نشان دهد.
  - فقط نوتیفیکیشن پیام مستقیم در مرکز اعلان پورتال نمایش داده می‌شود.

### مسیرهای API

- `GET /direct-communication/messaging/config`
  - نیازمند لاگین.
  - وضعیت فعال بودن ارسال پیام و نکات امنیتی را برمی‌گرداند.

- `GET /direct-communication/available-managers`
  - نیازمند لاگین.
  - لیست مدیران فعال قابل ارسال پیام را با اطلاعات محدود برمی‌گرداند.

- `GET /direct-communication/my/conversations`
  - نیازمند لاگین.
  - فقط مکالمه‌های ارسال‌شده توسط کاربر جاری را برمی‌گرداند.

- `GET /direct-communication/my/conversations/:id`
  - نیازمند لاگین.
  - جزئیات مکالمه و پیام‌ها را فقط زمانی برمی‌گرداند که کاربر جاری فرستنده همان مکالمه یا مدیر دریافت‌کننده همان مکالمه باشد.

- `POST /direct-communication/my/conversations`
  - نیازمند لاگین.
  - برای ارسال پیام توسط کاربر جاری استفاده می‌شود.
  - به صورت پیش‌فرض فعال است.
  - با `DIRECT_COMMUNICATION_MESSAGING_ENABLED=false` غیرفعال می‌شود.
  - payload پیام با AES-256-GCM سمت سرور رمزنگاری می‌شود.

- `POST /direct-communication/my/conversations/:id/replies`
  - نیازمند لاگین.
  - پاسخ به مکالمه را فقط برای فرستنده همان مکالمه یا مدیر دریافت‌کننده همان مکالمه ثبت می‌کند.
  - برای مکالمه‌های `ARCHIVED` و `CLOSED` پاسخ جدید ثبت نمی‌شود.
  - متن پیام در Audit Log ثبت نمی‌شود.

- `GET /direct-communication/my/inbox`
  - نیازمند لاگین.
  - فقط مکالمه‌هایی را برمی‌گرداند که کاربر جاری به عنوان مدیر یا مدیرعامل دریافت‌کننده آن‌هاست.

- `PUT /direct-communication/my/inbox/:id/status`
  - نیازمند لاگین.
  - فقط اگر کاربر جاری مدیر دریافت‌کننده همان مکالمه باشد، اجازه تغییر وضعیت دارد.

- `GET /direct-communication/conversations`
  - نیازمند `ceo.messages.view`.
  - مسیر مدیریتی برای مشاهده metadata مکالمه‌ها.

- `PUT /direct-communication/conversations/:id/status`
  - نیازمند `ceo.messages.manage`.
  - مسیر مدیریتی برای تغییر وضعیت metadata مکالمه.

- `GET/POST/PUT/DELETE /direct-communication/managers`
  - نیازمند `ceo.settings.manage`.

- `GET/POST/PUT/DELETE /direct-communication/forbidden-words`
  - نیازمند `ceo.settings.manage`.

### مدل‌های دیتابیس

- `DirectCommunicationManager`
  - نگهداری مدیرعامل و مدیران بخش‌ها.
  - فقط یک رکورد با `isCeo=true` مجاز است.

- `DirectCommunicationForbiddenWord`
  - نگهداری کلمات ممنوعه با نرمال‌سازی فارسی.

- `DirectCommunicationConversation`
  - نگهداری metadata مکالمه شامل مدیر دریافت‌کننده، موضوع، وضعیت، سطح محرمانگی، دسته‌بندی و اولویت.

- `DirectCommunicationMessage`
  - نگهداری payload پیام.
  - متن پیام نباید در audit log ثبت شود.

### Permissionها

- `ceo.settings.manage`
  - مدیریت مدیرعامل، مدیران و کلمات ممنوعه.

- `ceo.messages.view`
  - مشاهده metadata مکالمه‌ها در سطح مدیریتی.

- `ceo.messages.manage`
  - تغییر وضعیت metadata مکالمه‌ها در سطح مدیریتی.

- کاربران عادی برای ارسال و مشاهده پیام‌های خودشان permission جداگانه لازم ندارند؛ لاگین کافی است.
- مشاهده جزئیات و پاسخ به مکالمه بر اساس مالکیت مکالمه انجام می‌شود، نه صرف permission ادمین.

### ملاحظات امنیتی

- صفحه اصلی پورتال نباید لیست یا محتوای پیام‌ها را نمایش دهد.
- ادمین تنظیمات نباید به متن پیام‌های محرمانه یا ناشناس دسترسی داشته باشد.
- Audit log نباید متن پیام یا payload پیام را ثبت کند.
- فیلتر کلمات ممنوعه فقط روی عنوان و metadata قابل خواندن قابل اتکا است؛ بعد از رمزنگاری واقعی، متن رمزنگاری‌شده نباید سمت سرور باز شود.
- ارسال پیام با `DIRECT_COMMUNICATION_MESSAGING_ENABLED=false` غیرفعال می‌شود.
- نسخه عملیاتی فعلی payload پیام `server-aes-256-gcm-v1` است.
- برای محیط عملیاتی باید `DIRECT_COMMUNICATION_ENCRYPTION_KEY` با مقدار قوی و محرمانه تنظیم شود.
- پیام‌های قدیمی با `placeholder-v1` فقط برای سازگاری خوانده می‌شوند و پیام جدید با آن نسخه ذخیره نمی‌شود.
- رمزنگاری فعلی سمت سرور است و نباید به عنوان End-to-End معرفی شود.

### فاز بعدی

- طراحی رمزنگاری End-to-End واقعی در صورت نیاز به عدم دسترسی سرور به متن پیام.
- Recovery Key برای مدیرعامل.
- پاسخ به مکالمه‌ها و نمایش زنجیره پیام.
- تعیین رفتار دقیق حالت ناشناس برای ادامه مکالمه بدون افشای هویت.


## Active Directory read-only synchronization

Endpoint: `POST /api/directory/sync` (JWT + `directory.manage`). The service uses paged LDAP subtree searches, stable `objectGUID` identities, distinguished names, `sAMAccountName`, profile attributes and `userAccountControl`. Computer accounts are excluded. Group membership is reconstructed from AD member DNs. AD-origin directory records are protected against portal CRUD at the service layer; portal role mappings remain local. Missing records are deactivated rather than deleted to preserve foreign-key history.

Database migration `20260720090000_add_active_directory_sync_identity` adds nullable unique external IDs, DNs, sync timestamps and source/status indexes. Bind credentials remain masked by the settings API. Production should prefer LDAPS and a least-privilege read-only service account. Monitor sync duration and failures; do not schedule automatic sync until operational limits and change windows are approved.


## همگام‌سازی زمان‌بندی‌شده و دسترسی دایرکتوری

- فیلتر LDAP کاربران، حساب‌های computer و حساب‌های disabled را حذف می‌کند. تشخیص disabled با matching rule استاندارد Active Directory برای بیت دوم userAccountControl انجام می‌شود.
- سرویس DirectorySyncService هر دقیقه تنظیمات را بررسی می‌کند و فقط پس از سپری شدن activeDirectorySyncIntervalMinutes همگام‌سازی را اجرا می‌کند.
- زمان آخرین همگام‌سازی موفق در activeDirectoryLastSyncedAt ذخیره می‌شود. مقدار بازه در دیتابیس بین ۵ و ۱۰۰۸۰ دقیقه محدود شده است.
- endpointهای فهرست Directory فقط رکوردهای isActive=true را برمی‌گردانند. رکورد غیرفعال حذف فیزیکی نمی‌شود تا تاریخچه و ارتباطات سامانه حفظ شود.
- نقش‌ها و Permissionها local هستند. ایجاد Role یا DirectoryGroup به‌تنهایی هیچ RolePermission یا DirectoryGroupRole ایجاد نمی‌کند و اصل least privilege رعایت می‌شود.
- کاربران و گروه‌های AD از طریق داشبورد قابل ایجاد، ویرایش یا حذف نیستند؛ فقط تخصیص نقش محلی به گروه AD مجاز است.
- migration مربوط: 20260720094500_add_active_directory_sync_schedule.
