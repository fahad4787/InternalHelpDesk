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
import { UpdateZoomPreferencesDto } from './dto/update-zoom-preferences.dto';
import { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';
import { ZoomService } from './zoom.service';

@Controller('integrations/zoom')
export class ZoomController {
  private readonly logger = new Logger(ZoomController.name);

  constructor(
    private zoomService: ZoomService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.zoomService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.zoomService.getAuthUrl(user);
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
      `Zoom OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      this.logger.warn(`Zoom OAuth callback rejected: ${error}`);
      return res.redirect(
        `${frontendUrl}/integrations/zoom?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/zoom`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      this.logger.warn(`Zoom OAuth callback rejected: ${reason}`);
      return res.redirect(
        `${frontendUrl}/integrations/zoom?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.zoomService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/zoom?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Zoom connection failed';
      this.logger.error(`Zoom OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/zoom?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('connect-mock')
  @UseGuards(JwtAuthGuard)
  connectMock(@CurrentUser() user: AuthenticatedUser) {
    return this.zoomService.connectMock(user);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.zoomService.disconnect(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.zoomService.getProfile(user);
  }

  @Get('meetings')
  @UseGuards(JwtAuthGuard)
  getMeetings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('includePast') includePast?: string,
  ) {
    return this.zoomService.getMeetings(
      user,
      30,
      includePast === 'true',
    );
  }

  @Post('meetings')
  @UseGuards(JwtAuthGuard)
  createMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateZoomMeetingDto,
  ) {
    return this.zoomService.createMeeting(user, dto);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateZoomPreferencesDto,
  ) {
    return this.zoomService.updatePreferences(user, dto);
  }
}
