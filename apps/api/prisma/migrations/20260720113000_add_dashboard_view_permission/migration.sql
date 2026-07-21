INSERT INTO "Permission" ("id", "name", "title")
VALUES ('permission-dashboard-view', 'dashboard.view', 'مشاهده داشبورد مدیریت')
ON CONFLICT ("name") DO UPDATE SET "title" = EXCLUDED."title";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
JOIN "Permission" AS permission ON permission."name" = 'dashboard.view'
WHERE role."name" = 'admin'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Existing custom roles receive no dashboard access automatically.
-- An administrator can grant dashboard.view explicitly when appropriate.




