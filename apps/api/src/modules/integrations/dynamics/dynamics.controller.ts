import {
  Body,
  Controller,
  Get,
  Logger,
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
import { UpdateDynamicsPreferencesDto } from './dto/update-dynamics-preferences.dto';
import { DynamicsService } from './dynamics.service';

@Controller('integrations/dynamics')
export class DynamicsController {
  private readonly logger = new Logger(DynamicsController.name);

  constructor(
    private dynamicsService: DynamicsService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.dynamicsService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.dynamicsService.getAuthUrl(user);
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
      `Dynamics OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/dynamics?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/dynamics`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/dynamics?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.dynamicsService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}/integrations/dynamics?connected=true`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Dynamics connection failed';
      this.logger.error(`Dynamics OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/dynamics?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.dynamicsService.disconnect(user);
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  getContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.dynamicsService.getContacts(user);
  }

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  getAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.dynamicsService.getAccounts(user);
  }

  @Get('opportunities')
  @UseGuards(JwtAuthGuard)
  getOpportunities(@CurrentUser() user: AuthenticatedUser) {
    return this.dynamicsService.getOpportunities(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDynamicsPreferencesDto,
  ) {
    return this.dynamicsService.updatePreferences(user, dto);
  }
}
