# راهبرد محیط آزمایشگاهی و بروزرسانی محیط اصلی

## هدف

برای AGTPS Portal باید دو محیط جدا داشته باشیم:

- محیط آزمایشگاهی برای توسعه، تست و بررسی تغییرات.
- محیط اصلی برای استفاده کاربران شرکت.

هیچ تغییر جدیدی نباید مستقیم روی محیط اصلی اعمال شود.

## ساختار پیشنهادی

### محیط آزمایشگاهی

- یک Linux Server یا VM جدا.
- Docker و Docker Compose.
- دیتابیس PostgreSQL جدا.
- فایل env جدا مثل `docker/.env.lab`.
- دامنه یا آدرس جدا مثل:
  - `http://agtps-lab.local`
  - یا IP داخلی آزمایشگاه.

### محیط اصلی

- Linux Server اصلی.
- Docker و Docker Compose.
- دیتابیس و volumeهای پایدار.
- فایل env جدا مثل `docker/.env.production`.
- دامنه اصلی پورتال.

## قوانین branch

پیشنهاد:

- `main`: نسخه پایدار و قابل انتشار.
- `develop`: تغییرات آماده تست.
- feature branchها برای کارهای بزرگ‌تر.

اگر فعلا ساده‌تر بخواهیم:

- روی یک branch کار شود.
- قبل از push یا pull روی production، حتما در lab تست شود.

## راه‌اندازی از صفر روی سیستم شرکت

```bash
git clone <REPOSITORY_URL> AGTPS-Portal
cd AGTPS-Portal
cp docker/.env.example docker/.env
nano docker/.env
```

مقادیر مهم:

```env
POSTGRES_PASSWORD=...
JWT_SECRET=...
DIRECT_COMMUNICATION_ENCRYPTION_KEY=...
NEXT_PUBLIC_API_URL=/api
PORTAL_URL=http://YOUR_PORTAL_ADDRESS
FILE_SHARES_ROOT=/srv/agtps/file-shares
```

اجرای سرویس‌ها:

```bash
docker compose --env-file docker/.env -f docker/compose.yaml up -d --build
```

اجرای seed بعد از بالا آمدن اولیه:

```bash
docker compose --env-file docker/.env -f docker/compose.yaml exec api npm run seed
```

مشاهده لاگ:

```bash
docker compose --env-file docker/.env -f docker/compose.yaml logs -f api
docker compose --env-file docker/.env -f docker/compose.yaml logs -f web
```

## بروزرسانی محیط آزمایشگاهی

```bash
cd /path/to/AGTPS-Portal
git pull
docker compose --env-file docker/.env.lab -f docker/compose.yaml up -d --build
docker compose --env-file docker/.env.lab -f docker/compose.yaml exec api npx prisma migrate deploy
```

سپس تست کنید:

- ورود به پورتال.
- ورود به پنل ادمین.
- Health readiness.
- ارسال اعلان.
- بکاپ دستی.
- Restore فقط روی lab.
- صفحات اصلی ماژول‌های تغییرکرده.

## بروزرسانی محیط اصلی

قبل از بروزرسانی:

1. از پنل ادمین بکاپ کامل بگیرید.
2. فایل بکاپ را دانلود کنید.
3. روی lab همان نسخه را تست کنید.
4. زمان downtime کوتاه را اطلاع‌رسانی کنید.

اجرای بروزرسانی:

```bash
cd /path/to/AGTPS-Portal
git pull
docker compose --env-file docker/.env.production -f docker/compose.yaml up -d --build
docker compose --env-file docker/.env.production -f docker/compose.yaml exec api npx prisma migrate deploy
docker compose --env-file docker/.env.production -f docker/compose.yaml ps
```

بعد از بروزرسانی:

- `/api/health` را بررسی کنید.
- `/api/health/readiness` را از ادمین بررسی کنید.
- لاگ API و Web را ببینید.
- صفحه اصلی پورتال را باز کنید.
- چند صفحه ادمین مهم را تست کنید.

## Rollback

اگر بروزرسانی مشکل جدی داشت:

1. سرویس‌ها را متوقف نکنید مگر ضروری باشد.
2. لاگ‌ها را نگه دارید.
3. اگر مشکل از migration نبود، به commit قبلی برگردید و build کنید.
4. اگر دیتابیس خراب شده بود، Restore فقط با بکاپ تاییدشده انجام شود.

نمونه برگشت به commit قبلی:

```bash
git log --oneline -5
git checkout <GOOD_COMMIT>
docker compose --env-file docker/.env.production -f docker/compose.yaml up -d --build
```

## چک‌لیست قبل از انتقال از lab به production

- [ ] migration روی lab موفق است.
- [ ] seed در lab خطا نمی‌دهد.
- [ ] build Docker موفق است.
- [ ] Health readiness قابل قبول است.
- [ ] لاگ API خطای تکرارشونده ندارد.
- [ ] لاگ Web خطای تکرارشونده ندارد.
- [ ] بکاپ کامل production گرفته شده است.
- [ ] Restore روی lab تست شده است.
- [ ] تغییرات در راهنمای فارسی و مستند فنی ثبت شده‌اند.
