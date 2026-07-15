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
import { UpdateClickUpPreferencesDto } from './dto/update-clickup-preferences.dto';
import { ClickUpService } from './clickup.service';

@Controller('integrations/clickup')
export class ClickUpController {
  private readonly logger = new Logger(ClickUpController.name);

  constructor(
    private clickUpService: ClickUpService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.clickUpService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.clickUpService.getAuthUrl(user);
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
      `ClickUp OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/clickup?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/clickup`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/clickup?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.clickUpService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/clickup?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ClickUp connection failed';
      this.logger.error(`ClickUp OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/clickup?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.clickUpService.disconnect(user);
  }

  @Get('lists')
  @UseGuards(JwtAuthGuard)
  getLists(@CurrentUser() user: AuthenticatedUser) {
    return this.clickUpService.getLists(user);
  }

  @Get('lists/:listId')
  @UseGuards(JwtAuthGuard)
  getListDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listId') listId: string,
  ) {
    return this.clickUpService.getListDetail(user, listId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateClickUpPreferencesDto,
  ) {
    return this.clickUpService.updatePreferences(user, dto);
  }
}
