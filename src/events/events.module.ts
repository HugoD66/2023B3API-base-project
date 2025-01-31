import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { UsersModule } from '../users/users.module';
import { ProjectUsersModule } from '../project-user/project-users.module';
import { ProjectsModule } from '../projects/projects.module';
@Module({
  imports: [
    ProjectUsersModule,
    ProjectsModule,
    TypeOrmModule.forFeature([Event]),
    forwardRef(() => UsersModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
