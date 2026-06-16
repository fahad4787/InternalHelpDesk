import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { successResponse } from '../../common/utils/api-response.util';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const departments = await this.prisma.department.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { users: true, tickets: true } } },
      orderBy: { name: 'asc' },
    });

    return successResponse(departments);
  }

  async create(user: AuthenticatedUser, dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { name_companyId: { name: dto.name, companyId: user.companyId } },
    });
    if (existing) throw new ConflictException('Department already exists');

    const department = await this.prisma.department.create({
      data: { ...dto, companyId: user.companyId },
    });

    return successResponse(department, 'Department created');
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw new NotFoundException('Department not found');

    const department = await this.prisma.department.update({
      where: { id },
      data: dto,
    });

    return successResponse(department, 'Department updated');
  }

  async remove(user: AuthenticatedUser, id: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw new NotFoundException('Department not found');

    await this.prisma.department.delete({ where: { id } });
    return successResponse(null, 'Department deleted');
  }
}
