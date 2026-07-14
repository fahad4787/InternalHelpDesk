import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../common/types/api-response.type';
import { ConnectAsanaCodeDto } from './dto/connect-asana-code.dto';
import { UpdateAsanaPreferencesDto } from './dto/update-asana-preferences.dto';
import { AsanaService } from './asana.service';

@Controller('integrations/asana')
export class AsanaController {
  private readonly logger = new Logger(AsanaController.name);

  constructor(
    private asanaService: AsanaService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.asanaService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.asanaService.getAuthUrl(user);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://127.0.0.1:3000',
    );

    const error =
      typeof req.query.error === 'string' ? req.query.error : undefined;
    const code =
      typeof req.query.code === 'string' ? req.query.code : undefined;
    const state =
      typeof req.query.state === 'string' ? req.query.state : undefined;

    this.logger.log(
      `Asana OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/asana?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/asana`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/asana?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.asanaService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/asana?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Asana connection failed';
      this.logger.error(`Asana OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/asana?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('connect-mock')
  @UseGuards(JwtAuthGuard)
  connectMock(@CurrentUser() user: AuthenticatedUser) {
    return this.asanaService.connectMock(user);
  }

  @Post('connect-code')
  @UseGuards(JwtAuthGuard)
  connectCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConnectAsanaCodeDto,
  ) {
    return this.asanaService.connectWithCode(user, dto.code, dto.state);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.asanaService.disconnect(user);
  }

  @Get('projects')
  @UseGuards(JwtAuthGuard)
  getProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.asanaService.getProjects(user);
  }

  @Get('projects/:projectGid')
  @UseGuards(JwtAuthGuard)
  getProjectDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectGid') projectGid: string,
  ) {
    return this.asanaService.getProjectDetail(user, projectGid);
  }

  @Get('my-tasks')
  @UseGuards(JwtAuthGuard)
  getMyTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.asanaService.getMyTasks(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAsanaPreferencesDto,
  ) {
    return this.asanaService.updatePreferences(user, dto);
  }
}
