import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IntegrationProvider, UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/api-response.type';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.findAll(user);
  }

  @Post(':provider/connect')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  connect(
    @CurrentUser() user: AuthenticatedUser,
    @Param('provider') provider: string,
    @Body() config: Record<string, unknown>,
  ) {
    return this.integrationsService.connect(
      user,
      provider.toUpperCase() as IntegrationProvider,
      config,
    );
  }

  @Post(':provider/disconnect')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  disconnect(
    @CurrentUser() user: AuthenticatedUser,
    @Param('provider') provider: string,
  ) {
    return this.integrationsService.disconnect(
      user,
      provider.toUpperCase() as IntegrationProvider,
    );
  }
}
