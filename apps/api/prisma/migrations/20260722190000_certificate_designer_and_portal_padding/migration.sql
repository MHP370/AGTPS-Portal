ALTER TABLE "InPersonTraining" ADD COLUMN "courseCode" TEXT;

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "InPersonTraining"
)
UPDATE "InPersonTraining" t
SET "courseCode" = CONCAT('COURSE-', LPAD(numbered.rn::text, 5, '0'))
FROM numbered
WHERE t."id" = numbered."id";

ALTER TABLE "InPersonTraining" ALTER COLUMN "courseCode" SET NOT NULL;
CREATE UNIQUE INDEX "InPersonTraining_courseCode_key" ON "InPersonTraining"("courseCode");
ALTER TABLE "Setting" ADD COLUMN "portalHorizontalPaddingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
