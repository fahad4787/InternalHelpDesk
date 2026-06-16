import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { successResponse } from '../../common/utils/api-response.util';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getCompany(user: AuthenticatedUser) {
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            tickets: true,
            chatSessions: true,
          },
        },
      },
    });

    if (!company) throw new NotFoundException('Company not found');
    return successResponse(company);
  }

  async updateCompany(user: AuthenticatedUser, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: dto,
    });

    return successResponse(company, 'Company updated');
  }
}
