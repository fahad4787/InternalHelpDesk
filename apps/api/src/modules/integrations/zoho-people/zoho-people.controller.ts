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
import { UpdateZohoPeoplePreferencesDto } from './dto/update-zoho-people-preferences.dto';
import { ZohoPeopleService } from './zoho-people.service';

@Controller('integrations/zoho-people')
export class ZohoPeopleController {
  private readonly logger = new Logger(ZohoPeopleController.name);

  constructor(
    private zohoPeopleService: ZohoPeopleService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoPeopleService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoPeopleService.getAuthUrl(user);
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
    const accountsServer =
      typeof req.query['accounts-server'] === 'string'
        ? req.query['accounts-server']
        : undefined;

    this.logger.log(
      `Zoho People OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/zoho-people?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/zoho-people`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/zoho-people?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.zohoPeopleService.handleCallback(code, state, accountsServer);
      return res.redirect(
        `${frontendUrl}/integrations/zoho-people?connected=true`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Zoho People connection failed';
      this.logger.error(`Zoho People OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/zoho-people?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoPeopleService.disconnect(user);
  }

  @Get('employees')
  @UseGuards(JwtAuthGuard)
  getEmployees(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoPeopleService.getEmployees(user);
  }

  @Get('leave')
  @UseGuards(JwtAuthGuard)
  getLeave(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoPeopleService.getLeave(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateZohoPeoplePreferencesDto,
  ) {
    return this.zohoPeopleService.updatePreferences(user, dto);
  }
}
