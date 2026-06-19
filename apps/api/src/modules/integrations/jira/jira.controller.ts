import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../common/types/api-response.type';
import { UpdateJiraPreferencesDto } from './dto/update-jira-preferences.dto';
import { JiraService } from './jira.service';

@Controller('integrations/jira')
export class JiraController {
  private readonly logger = new Logger(JiraController.name);

  constructor(
    private jiraService: JiraService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.jiraService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.jiraService.getAuthUrl(user);
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
      `Jira OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/jira?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/jira`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/jira?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.jiraService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/jira?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Jira connection failed';
      this.logger.error(`Jira OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/jira?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('connect-mock')
  @UseGuards(JwtAuthGuard)
  connectMock(@CurrentUser() user: AuthenticatedUser) {
    return this.jiraService.connectMock(user);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.jiraService.disconnect(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.jiraService.getProfile(user);
  }

  @Get('issues')
  @UseGuards(JwtAuthGuard)
  getIssues(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: string,
  ) {
    return this.jiraService.getIssues(user, type === 'reported' ? 'reported' : 'assigned');
  }

  @Get('projects')
  @UseGuards(JwtAuthGuard)
  getProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.jiraService.getProjects(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateJiraPreferencesDto,
  ) {
    return this.jiraService.updatePreferences(user, dto);
  }
}
