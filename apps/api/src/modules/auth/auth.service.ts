import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { successResponse } from '../../common/utils/api-response.util';
import { generateSlug } from '../../common/utils/slug.util';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { AuthenticatedUser } from '../../common/types/api-response.type';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto) {
    const slug = generateSlug(dto.companyName);
    const existing = await this.prisma.company.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Company name already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug,
        domain: dto.domain,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: UserRole.COMPANY_ADMIN,
          },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const token = this.generateToken(user);

    return successResponse(
      {
        token,
        user: this.sanitizeUser(user),
        company: { id: company.id, name: company.name, slug: company.slug },
      },
      'Company registered successfully',
    );
  }

  async login(dto: LoginDto) {
    const users = await this.prisma.user.findMany({
      where: { email: dto.email, isActive: true },
      include: { company: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches: typeof users = [];
    for (const user of users) {
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (valid) matches.push(user);
    }

    if (matches.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = matches[0];
    const company = user.company;

    const token = this.generateToken(user);

    return successResponse(
      {
        token,
        user: this.sanitizeUser(user),
        company: { id: company.id, name: company.name, slug: company.slug },
      },
      'Login successful',
    );
  }

  async getProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        companyId: true,
        departmentId: true,
        company: { select: { id: true, name: true, slug: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return successResponse(profile);
  }

  async inviteUser(dto: InviteUserDto, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.user.findUnique({
      where: {
        email_companyId: { email: dto.email, companyId: currentUser.companyId },
      },
    });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role ?? UserRole.EMPLOYEE,
        token,
        expiresAt,
        companyId: currentUser.companyId,
        invitedById: currentUser.id,
      },
    });

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

    return successResponse(
      {
        invitation,
        inviteUrl: `${frontendUrl}/accept-invite?token=${token}`,
      },
      'Invitation sent successfully',
    );
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
    });

    if (!invitation || invitation.acceptedAt) {
      throw new BadRequestException('Invalid invitation');
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: invitation.role,
          companyId: invitation.companyId,
        },
      });
    });

    const company = await this.prisma.company.findUnique({
      where: { id: invitation.companyId },
    });

    const token = this.generateToken(user);

    return successResponse(
      {
        token,
        user: this.sanitizeUser(user),
        company: { id: company!.id, name: company!.name, slug: company!.slug },
      },
      'Invitation accepted',
    );
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
    });

    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.passwordReset.create({
        data: { email: dto.email, token, expiresAt },
      });
    }

    return successResponse(
      { message: 'If the account exists, a reset link will be sent' },
      'Password reset initiated',
    );
  }

  private generateToken(user: { id: string; email: string; role: UserRole; companyId: string }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    companyId: string;
    avatarUrl?: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl,
    };
  }
}
