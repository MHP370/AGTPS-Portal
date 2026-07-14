INSERT INTO "public"."Permission" ("id", "name", "title")
VALUES
  ('perm_file_shares_view', 'file-shares.view', 'View File Shares'),
  ('perm_file_shares_manage', 'file-shares.manage', 'Manage File Shares')
ON CONFLICT ("name") DO UPDATE SET "title" = EXCLUDED."title";

INSERT INTO "public"."RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "public"."Role" r
CROSS JOIN "public"."Permission" p
WHERE r."name" = 'admin'
  AND p."name" IN ('file-shares.view', 'file-shares.manage')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "public"."PortalModule" (
  "id",
  "key",
  "title",
  "description",
  "icon",
  "route",
  "permission",
  "isCore",
  "isInstalled",
  "isEnabled",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
VALUES (
  'module_file_shares',
  'file-shares',
  'فایل شیر',
  'مرور امن فولدرهای شبکه و فایل‌های SMB بر اساس دسترسی کاربر و گروه.',
  'FolderOpen',
  '/admin/file-shares',
  'file-shares.manage',
  false,
  true,
  true,
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "route" = EXCLUDED."route",
  "permission" = EXCLUDED."permission",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;
