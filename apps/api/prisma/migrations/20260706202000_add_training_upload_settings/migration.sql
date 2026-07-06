ALTER TABLE "Setting" ADD COLUMN "trainingMaxUploadSizeMb" INTEGER NOT NULL DEFAULT 2048;
ALTER TABLE "Setting" ADD COLUMN "trainingAllowedFileExtensions" TEXT NOT NULL DEFAULT 'mp4,mkv,webm,mov,avi,pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,webp,gif,txt,csv,zip,rar,7z';
