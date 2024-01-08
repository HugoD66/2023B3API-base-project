import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { createObjectCsvWriter } from 'csv-writer';
import { EventResponseDto } from '../events/dto/event-response.dto';
import { UserResponseDto } from '../users/dto/user-response-dto';
import { ProjectUsersService } from '../project-user/project-users.service';
import * as cron from 'node-cron';
import { ProjectUser } from '../project-user/entities/project-user.entity';
import { ProjectResponseDto } from '../projects/dto/project-response-dto';

@Injectable()
export class CsvExportService {
  constructor(
    private readonly usersService: UsersService,

    private readonly eventsService: EventsService,

    private readonly projectsService: ProjectsService,

    private readonly projectUsersService: ProjectUsersService,
  ) {
    //Génération automatique du fichier csv le 25 de chaque mois
    //Pour tester cette fonctionnalité, remplacer par '*/1 * * * *' pour le générer chaques minutes.
    cron.schedule('0 0 25 * *', async () => {
      await this.exportCsvForCurrentMonth();
    });
  }
  async exportCsvForCurrentMonth() {
    try {
      const events: EventResponseDto[] =
        await this.eventsService.getAcceptedEventsForCurrentMonth();
      const data = await Promise.all(
        events.map(async (event: EventResponseDto) => {
          const user: UserResponseDto = await this.usersService.findOne(
            event.userId,
          );
          const projectUser: ProjectUser =
            await this.projectUsersService.findOneByDateAndUser(
              new Date(event.date),
              event.userId,
            );
          const project: ProjectResponseDto =
            await this.projectsService.findOne(projectUser.projectId, user);
          return {
            UserName: user.username,
            ProjectName: project.name,
          };
        }),
      );
      const csvWriter = createObjectCsvWriter({
        path: 'logs/conges_acceptes.csv',
        header: [
          { id: 'UserName', title: "Nom d'utilisateur" },
          { id: 'ProjectName', title: 'Nom du projet' },
        ],
      });
      await csvWriter.writeRecords(data);
    } catch (error) {
      throw error;
    }
  }
}
