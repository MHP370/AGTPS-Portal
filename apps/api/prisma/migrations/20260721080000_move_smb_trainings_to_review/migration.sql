UPDATE "TrainingItem"
SET "status" = 'NEEDS_REVIEW'
WHERE "sourceType" = 'SMB'
  AND "status" = 'PUBLISHED';
