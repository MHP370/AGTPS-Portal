CREATE TABLE "public"."DirectoryGroupRole" (
  "groupId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,

  CONSTRAINT "DirectoryGroupRole_pkey" PRIMARY KEY ("groupId","roleId")
);

ALTER TABLE "public"."DirectoryGroupRole"
ADD CONSTRAINT "DirectoryGroupRole_groupId_fkey"
FOREIGN KEY ("groupId")
REFERENCES "public"."DirectoryGroup"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "public"."DirectoryGroupRole"
ADD CONSTRAINT "DirectoryGroupRole_roleId_fkey"
FOREIGN KEY ("roleId")
REFERENCES "public"."Role"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
