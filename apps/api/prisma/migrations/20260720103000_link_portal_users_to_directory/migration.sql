ALTER TABLE "User" ADD COLUMN "directoryUserId" TEXT;

CREATE UNIQUE INDEX "User_directoryUserId_key" ON "User"("directoryUserId");

ALTER TABLE "User" ADD CONSTRAINT "User_directoryUserId_fkey"
FOREIGN KEY ("directoryUserId") REFERENCES "DirectoryUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
