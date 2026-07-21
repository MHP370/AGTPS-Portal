UPDATE "TrainingItem"
SET "fileUrl" = '/api/trainings/items/' || "id" || '/content'
WHERE "sourceType" = 'SMB';

UPDATE "TrainingFile" AS file
SET "fileUrl" = '/api/trainings/items/' || item."id" || '/content'
FROM "TrainingItem" AS item
WHERE file."trainingId" = item."id"
  AND item."sourceType" = 'SMB';
