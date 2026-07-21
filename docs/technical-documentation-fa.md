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


## احراز هویت دستی Active Directory با LDAPS

- `POST /api/auth/login` فیلد `authSource` با مقادیر `LOCAL` یا `ACTIVE_DIRECTORY` می‌پذیرد. مقدار پیش‌فرض برای سازگاری عقب‌رو `LOCAL` است.
- `GET /api/auth/login-options` فقط وضعیت روش‌ها و نام دامنه را برمی‌گرداند و اطلاعات Bind را افشا نمی‌کند.
- ورود AD فقط با URL دارای `ldaps://` مجاز است. Root CA و TLS server name از تنظیمات AD خوانده می‌شوند و خاموش‌کردن اعتبارسنجی گواهی مجاز نیست.
- رمز AD ذخیره یا log نمی‌شود. LDAP bind با UPN کاربر انجام و اتصال در finally بسته می‌شود.

## Windows Integrated Authentication (Kerberos/SPNEGO)

- مسیر عمومی مرورگر `/sso/identity` و `/sso/login` توسط سرویس محدود `agtps-sso` با Apache `mod_auth_gssapi` محافظت می‌شود.
- سرویس SSO با keytab حساب `HTTP/portal.agtps.net@AGTPS.NET` هویت Kerberos را اعتبارسنجی و درخواست را مستقیماً به API داخلی ارسال می‌کند.
- API فقط Header هویت همراه با `SSO_SHARED_SECRET` مشترک را قبول می‌کند. nginx ورودی این Headerها را در مسیر عمومی `/api/` حذف می‌کند تا جعل هویت از مرورگر ممکن نباشد.
- keytab میزبان read-only mount می‌شود و entrypoint یک کپی داخلی با مجوز `0640` و مالکیت `root:www-data` می‌سازد؛ keytab نباید داخل image یا repository ذخیره شود.
- `windowsSsoEnabled` فعال‌بودن SSO و `requirePortalLogin` اجبار احراز هویت صفحات کاربری را کنترل می‌کنند. middleware تنظیم را از `INTERNAL_API_URL` می‌خواند و در صورت عدم دسترسی به تنظیمات، دسترسی مهمان را fail-closed به صفحه ورود هدایت می‌کند.
- endpoint ورود فقط کاربران فعال و sync‌شده با منبع `ACTIVE_DIRECTORY` را می‌پذیرد و JWT استاندارد سامانه را صادر می‌کند.
- Chrome/Edge باید `AuthServerAllowlist=portal.agtps.net` داشته باشند. Firefox از `network.negotiate-auth.trusted-uris=https://portal.agtps.net` یا Enterprise Policy معادل `Authentication.SPNEGO` استفاده می‌کند. Delegation برای Login لازم نیست.
- حساب سرویس باید `msDS-SupportedEncryptionTypes=24` داشته باشد تا Ticket با AES128/AES256 و سازگار با keytab AES صادر شود؛ RC4 نباید به‌عنوان راه‌حل دائمی به keytab اضافه شود.

## Portal layout, permission-aware admin dashboard and browser notifications

- صفحه `/` همه ماژول‌ها و ویجت‌های فعال سراسری را برای کاربران احرازشده نمایش می‌دهد؛ Permission نقش یا گروه AD برای حذف محتوای عمومی پورتال استفاده نمی‌شود. کنترل Permission همچنان در مسیرها، عملیات و داشبورد مدیریت اعمال می‌شود و لینک admin dashboard فقط با `dashboard.view` ساخته می‌شود.
- مقدار `column` هر ویجت هنگام normalize حفظ می‌شود و ترتیب در هر ستون مستقل محاسبه می‌گردد. `hero`، `map` و `systems` همیشه در مرکز قفل هستند؛ سایر ویجت‌ها از تنظیمات بین سه ستون قابل انتقال‌اند.
- نقشه و فیلتر سامانه‌های صفحه اصلی سایت‌های فعال را از endpoint فقط‌خواندنی `/portal/sites` دریافت می‌کنند. CRUD مدیریتی سایت‌ها همچنان روی `/sites` و تحت Permission `sites.manage` باقی می‌ماند؛ بنابراین محتوای عمومی پورتال میان مدیر و کاربران AD یکسان است، بدون اینکه مجوز مدیریت تضعیف شود.
- endpoint عمومی `/portal/sites/weather` اطلاعات جاری Open-Meteo را در Backend با timeout و cache ده‌دقیقه‌ای تجمیع می‌کند. مختصات ذخیره‌شده سایت اولویت دارد و geocoding نام/آدرس فقط fallback غیرذخیره‌ای است. شکست provider برای هر سایت ایزوله می‌شود و رابط کاربری پیام fallback نشان می‌دهد.
- hook اعلان وضعیت `Notification.permission` را در mount، focus و visibility change همگام می‌کند. درخواست مجوز فقط در وضعیت `default` و در پاسخ به کلیک کاربر اجرا می‌شود؛ وضعیت `denied` با راهنمای پایدار مدیریت می‌شود، چون Web Notification API اجازه prompt مجدد برنامه‌ای نمی‌دهد.
- فقط `DirectoryUser` فعال با source برابر `ACTIVE_DIRECTORY` اجازه تلاش برای ورود دارد.
- `User.directoryUserId` لینک یکتا و صریح حساب سامانه به هویت AD است و از تصاحب نقش حساب محلی هم‌نام جلوگیری می‌کند.
- حساب provision شده رمز تصادفی غیرقابل استفاده، `allowPasswordChange=false` و بدون UserRole مستقیم دارد. دسترسی فقط از DirectoryGroupRoleهای ادمین‌تخصیص‌یافته محاسبه می‌شود.
- ورود محلی برای حساب اضطراری مدیر مستقل از دسترس‌پذیری AD باقی می‌ماند.
- migrationها: `20260720103000_link_portal_users_to_directory` و `20260720104500_add_active_directory_tls_trust`.

## سیاست دسترسی داشبورد و Context پیام‌ها

- Permission جدید `dashboard.view` مرز صریح دسترسی به داشبورد مدیریتی است. migration فقط آن را به نقش `admin` موجود تخصیص می‌دهد و نقش‌های سفارشی باید صریحاً توسط ادمین مجوز بگیرند.
- Admin layout قبل از render کردن child page، Permission و وضعیت module را بررسی می‌کند؛ بنابراین برای کاربر فاقد `dashboard.view` کامپوننت داشبورد mount نشده و queryهای آمار و سلامت نیز اجرا نمی‌شوند.
- redirect پس از login برای کاربر بدون Permission به `/` است. حساب دارای `dashboard.view` به `/admin/dashboard` هدایت می‌شود.
- endpoint جدید `GET /api/direct-communication/my/context` مقدار `isManager` را بر اساس اتصال واقعی DirectCommunicationManager به حساب پورتال یا DirectoryUser محاسبه می‌کند.
- query صندوق مدیر در frontend با `enabled=isManager` کنترل می‌شود؛ کاربران عادی نه تب را می‌بینند و نه درخواست inbox را ارسال می‌کنند.
- migration مربوط: `20260720113000_add_dashboard_view_permission`.


## Active Directory contact attributes

User contact fields use AD attributes mail and mobile. Profile writes require LDAPS and a least-privilege bind account with write access only to those attributes. The API writes AD first and updates portal data only after LDAP success. Directory group membership is omitted from ordinary profile responses and is returned only with directory.manage permission. Settings requireUserEmail and requireUserMobile control profile completion enforcement.


## تنظیم عمومی SMB و DFS

در مدیریت فایل‌شیر و منابع آموزش، مسیر UNC یا DFS، روش احراز هویت و Realm قابل ویرایش است. دکمه تست اتصال DNS و پورت 445 را بررسی می‌کند و آمادگی Kerberos را جداگانه گزارش می‌دهد. وضعیت NETWORK_REACHABLE به معنی دسترسی شبکه است و به معنی آماده بودن ACL کاربر نیست؛ برای ACL واقعی وضعیت READY و DNS/SPN معتبر لازم است.
# معماری دسترسی SMB آموزش و فایل‌شیر

- فایل‌شیر عمومی سازمان از Kerberos Constrained Delegation استفاده می‌کند تا عملیات SMB با هویت واقعی کاربر دامنه انجام شود. کاربران فعال AD بدون تعریف ACL تکراری در پورتال Share را می‌بینند، اما نتیجه مرور پوشه تابع ACL ویندوز است.
- حساب‌های دارای `AccountNotDelegated=True` عمداً توسط KDC برای S4U2Proxy رد می‌شوند. استفاده از هویت سرویس به‌عنوان fallback در فایل‌شیر ممنوع است، چون باعث دور زدن ACL کاربر می‌شود.
- منبع آموزش SMB با حساب سرویس فقط برای ایندکس و دریافت محتوای آموزشی سازمانی خوانده می‌شود. endpoint محتوای آموزش JWT می‌خواهد و فایل منتشرنشده را فقط به دارنده `training.manage` می‌دهد.
- محتوای آموزش در volume نام‌دار `training-cache` و مسیر `/var/cache/agtps/training` کش می‌شود. پاسخ HTTP از Range پشتیبانی می‌کند تا ویدیو و PDF در مرورگر قابل پیش‌نمایش باشند.
- رکوردهای جدید SMB با وضعیت `NEEDS_REVIEW` ساخته می‌شوند و sync بعدی وضعیت انتخاب‌شده مدیر را بازنویسی نمی‌کند.
- migrationهای `20260721080000_move_smb_trainings_to_review` و `20260721080500_rewrite_smb_training_content_urls` داده‌های قبلی را به جریان جدید منتقل می‌کنند.
- حالت `SHARED_ACCOUNT` فایل‌شیر با اعتبار رمزنگاری‌شده AES-256-GCM کار می‌کند و برای تمام کاربران authenticated دسترسی یکسان می‌سازد. رمز از API ماسک می‌شود و از متغیر `DIRECT_COMMUNICATION_ENCRYPTION_KEY` یا `JWT_SECRET` مشتق می‌شود.
- scheduler آموزش هر ۶۰ ثانیه منابع فعال را بررسی می‌کند و بر اساس `syncIntervalMinutes` تصمیم به اجرا می‌گیرد. اجرای هم‌زمان یک منبع با قفل درون‌پردازه‌ای جلوگیری می‌شود.
- سینک پوشه‌ای، `TrainingItem.sourcePath` را به ریشه پوشه و `TrainingFile.sourcePath` را به مسیر واقعی هر فایل متصل می‌کند. رکوردهای قدیمی خارج از ساختار فعال آرشیو می‌شوند و حذف فیزیکی نمی‌شوند.
- آپلود SMB ابتدا روی دیسک موقت کانتینر نوشته می‌شود، سپس با حساب Service Account به `uploadDirectory/trainingSlug` انتقال می‌یابد و فایل موقت در بلوک finally حذف می‌شود.
- migration `20260721090000_add_shared_smb_and_training_folder_sync` فیلدهای حالت مشترک، زمان‌بندی، مسیر آپلود و ساختار پوشه‌ای را اضافه می‌کند.
