import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const folderPermissions = new Map<string, string[]>([
  ['settings', ['settings.manage']],
  ['sites', ['sites.manage']],
  ['applications', ['applications.manage']],
  ['categories', ['categories.manage']],
  ['downloads', ['downloads.manage']],
  [
    'icons',
    [
      'applications.manage',
      'categories.manage',
      'downloads.manage',
      'settings.manage',
      'system-statuses.manage',
    ],
  ],
  ['sliders', ['sliders.manage']],
  ['news', ['news.publish']],
  ['announcements', ['announcements.publish']],
  ['training', ['training.manage']],
]);

@Injectable()
export class UploadPermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const folder = request.params?.folder;

    if (!folder || !folderPermissions.has(folder)) {
      throw new BadRequestException('مسیر آپلود معتبر نیست.');
    }

    const userPermissions = request.user?.permissions;
    if (!Array.isArray(userPermissions)) {
      throw new ForbiddenException('دسترسی آپلود معتبر نیست.');
    }

    const allowedPermissions = folderPermissions.get(folder) ?? [];
    const canUpload = allowedPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!canUpload) {
      throw new ForbiddenException('برای آپلود در این بخش دسترسی ندارید.');
    }

    return true;
  }
}
