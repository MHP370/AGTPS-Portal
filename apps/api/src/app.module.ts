import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlidersModule } from './sliders/sliders.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SitesModule } from './sites/sites.module';
import { ApplicationsModule } from './applications/applications.module';
import { CategoriesModule } from './categories/categories.module';
import { NewsModule } from './news/news.module';
import { SettingsModule } from './settings/settings.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { UploadsModule } from './uploads/uploads.module';
import { MeetingsModule } from './meetings/meetings.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { DirectoryModule } from './directory/directory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DownloadsModule } from './downloads/downloads.module';
import { PortalModulesModule } from './portal-modules/portal-modules.module';
import { SystemStatusesModule } from './system-statuses/system-statuses.module';
import { TrainingsModule } from './trainings/trainings.module';




@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    SitesModule,
    ApplicationsModule,
    CategoriesModule,
    NewsModule,
    AnnouncementsModule,
    SlidersModule,
    SettingsModule,
    RolesModule,
    PermissionsModule,
    UserRolesModule,
    RolePermissionsModule,
    UploadsModule,
    MeetingsModule,
    WorkspaceModule,
    DirectoryModule,
    NotificationsModule,
    DownloadsModule,
    PortalModulesModule,
    SystemStatusesModule,
    TrainingsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
