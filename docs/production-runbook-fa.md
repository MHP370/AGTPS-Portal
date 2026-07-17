# راهنمای انتشار و عملیات AGTPS Portal

## هدف

این سند برای راه‌اندازی، بررسی سلامت، بکاپ، Restore و عیب‌یابی پورتال AGTPS روی سرور اصلی استفاده می‌شود.

مستندهای مرتبط:

- `docs/company-handoff-fa.md`
- `docs/lab-to-production-fa.md`
- `docs/technical-documentation-fa.md`
- `docs/portal-user-admin-guide-fa.md`

## پیش‌نیازهای سرور

- Linux Server
- Docker و Docker Compose
- دسترسی پایدار به PostgreSQL
- مسیر دائمی برای `uploads`
- مسیر دائمی برای بکاپ‌ها
- مقداردهی envهای ضروری:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `DIRECT_COMMUNICATION_ENCRYPTION_KEY`
  - `NEXT_PUBLIC_API_URL`
  - `PORTAL_URL`
  - `BACKUP_DIR`

## راه‌اندازی

1. سورس پروژه را روی سرور قرار دهید.
2. فایل env را مطابق `docker/.env.example` تکمیل کنید.
3. سرویس‌ها را اجرا کنید:

```bash
docker compose -f docker/compose.yaml up -d --build
```

4. لاگ‌ها را بررسی کنید:

```bash
docker compose -f docker/compose.yaml logs -f api
docker compose -f docker/compose.yaml logs -f web
```

برای نصب از صفر روی سیستم شرکت و راه‌اندازی محیط آزمایشگاهی، سند زیر را دنبال کنید:

```text
docs/lab-to-production-fa.md
```

## بررسی سلامت

Endpoint عمومی:

```text
GET /api/health
```

Endpoint ادمین:

```text
GET /api/health/readiness
```

در پنل ادمین مسیر زیر را بررسی کنید:

```text
Admin → Dashboard → Production Readiness
```

## بکاپ

مسیر:

```text
Admin → Backup Center
```

موارد قابل انجام:

- بکاپ دستی دیتابیس
- بکاپ دستی فایل‌ها
- بکاپ کامل
- زمان‌بندی ساعتی، روزانه، هفتگی، ماهانه
- دانلود امن بکاپ
- ارسال نتیجه بکاپ از Notification Center

## Restore

قبل از Restore:

- ابتدا یک بکاپ جدید بگیرید.
- مطمئن شوید بکاپ اضطراری ساخته می‌شود.
- Restore دیتابیس را ابتدا در محیط تست امتحان کنید.

برای Restore:

```text
Admin → Backup Center → Restore
```

عبارت تایید:

```text
RESTORE
```

## Notification Center

مسیر:

```text
Admin → Notification Center
```

موارد:

- SMTP Servers
- Email Templates
- Notification Rules
- Email Queue
- Reports

همه ماژول‌ها باید اعلان و ایمیل را فقط از این مرکز ارسال کنند.

## Audit Log

مسیر:

```text
Admin → Audit Logs
```

در Audit Log محتوای محرمانه ذخیره نمی‌شود. فقط نوع عملیات، کاربر، زمان، IP و شناسه موجودیت ثبت می‌شود.

## چک‌لیست قبل از انتشار

- [ ] `DATABASE_URL` تنظیم شده است.
- [ ] `JWT_SECRET` مقدار امن دارد.
- [ ] `DIRECT_COMMUNICATION_ENCRYPTION_KEY` مقدار امن، جدا از JWT و پشتیبان‌گیری‌شده دارد.
- [ ] `PORTAL_URL` تنظیم شده است.
- [ ] volume مربوط به uploads پایدار است.
- [ ] volume مربوط به backups پایدار است.
- [ ] Health readiness وضعیت قابل قبول دارد.
- [ ] حداقل یک بکاپ موفق گرفته شده است.
- [ ] دانلود بکاپ تست شده است.
- [ ] Restore روی محیط تست بررسی شده است.
- [ ] SMTP تست شده است.
- [ ] Notification Rules مرور شده‌اند.
- [ ] Audit Log فعال است.
- [ ] دسترسی Restore فقط برای مدیر مجاز است.

## عیب‌یابی سریع

### API بالا نمی‌آید

- لاگ API را ببینید.
- `DATABASE_URL` و دسترسی دیتابیس را بررسی کنید.
- migrationها را بررسی کنید.

### بکاپ خطا می‌دهد

- نصب بودن `pg_dump` و `tar` در container/API را بررسی کنید.
- writable بودن `BACKUP_DIR` را بررسی کنید.

### Restore خطا می‌دهد

- نصب بودن `psql` و `tar` را بررسی کنید.
- مطمئن شوید بکاپ جدید با فرمت دارای `--clean --if-exists` ساخته شده است.

### ایمیل ارسال نمی‌شود

- SMTP فعال تعریف کنید.
- تست SMTP بگیرید.
- صف ایمیل را بررسی کنید.
- Notification Rule مربوطه را بررسی کنید.
