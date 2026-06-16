import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../../common/types/api-response.type';
import { ConnectWorkdayDto, TestWorkdayConnectionDto } from './dto/connect-workday.dto';
import { WorkdayArticlesQueryDto } from './dto/sync-workday.dto';
import { WorkdayService } from './workday.service';

@Controller('integrations/workday')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
export class WorkdayController {
  constructor(private workdayService: WorkdayService) {}

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.workdayService.getStatus(user);
  }

  @Post('connect')
  connect(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConnectWorkdayDto) {
    return this.workdayService.connect(user, dto);
  }

  @Post('test-connection')
  testConnection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TestWorkdayConnectionDto,
  ) {
    return this.workdayService.testConnection(user, dto);
  }

  @Post('sync')
  sync(@CurrentUser() user: AuthenticatedUser) {
    return this.workdayService.syncArticles(user);
  }

  @Post('reset')
  reset(@CurrentUser() user: AuthenticatedUser) {
    return this.workdayService.reset(user);
  }

  @Get('sync-logs')
  getSyncLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.workdayService.getSyncLogs(user);
  }

  @Get('articles')
  getArticles(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WorkdayArticlesQueryDto,
  ) {
    return this.workdayService.getArticles(user, query);
  }
}
