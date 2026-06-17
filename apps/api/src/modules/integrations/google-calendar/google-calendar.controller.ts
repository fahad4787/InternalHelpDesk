import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../common/types/api-response.type';
import { GoogleCalendarService } from './google-calendar.service';
import { UpdateGooglePreferencesDto } from './dto/update-google-preferences.dto';
import { CreateMeetDto } from './dto/create-meet.dto';

@Controller('integrations/google-calendar')
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.googleCalendarService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.googleCalendarService.getAuthUrl(user);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    if (error || !code || !state) {
      const reason = error ?? 'missing_code_or_state';
      this.logger.warn(`Google OAuth callback rejected: ${reason}`);
      return res.redirect(
        `${frontendUrl}/integrations/google?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.googleCalendarService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/google?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google Calendar connection failed';
      this.logger.error(`Google OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/google?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('connect-mock')
  @UseGuards(JwtAuthGuard)
  connectMock(@CurrentUser() user: AuthenticatedUser) {
    return this.googleCalendarService.connectMock(user);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.googleCalendarService.disconnect(user);
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  getEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.googleCalendarService.getEvents(user);
  }

  @Get('drive/files')
  @UseGuards(JwtAuthGuard)
  getDriveFiles(@CurrentUser() user: AuthenticatedUser) {
    return this.googleCalendarService.getDriveFiles(user);
  }

  @Get('gmail/messages')
  @UseGuards(JwtAuthGuard)
  getGmailMessages(@CurrentUser() user: AuthenticatedUser) {
    return this.googleCalendarService.getGmailMessages(user);
  }

  @Post('events/meet')
  @UseGuards(JwtAuthGuard)
  createMeet(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMeetDto,
  ) {
    return this.googleCalendarService.createMeet(user, dto);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGooglePreferencesDto,
  ) {
    return this.googleCalendarService.updatePreferences(user, dto);
  }
}
