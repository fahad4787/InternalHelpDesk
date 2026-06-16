'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Users } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { USER_ROLES } from '@/constants/roles';
import { usersService } from '@/services/users.service';
import { User } from '@/types/api.types';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersService.getAll({ page, limit: 10, search: search || undefined }),
  });

  const users = data?.data ?? [];

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (row: User) => (
        <span className="font-medium">{row.firstName} {row.lastName}</span>
      ),
    },
    { key: 'email', header: 'Email', cell: (row: User) => row.email },
    { key: 'role', header: 'Role', cell: (row: User) => <Badge variant="secondary">{USER_ROLES[row.role]}</Badge> },
    {
      key: 'status',
      header: 'Status',
      cell: (row: User) => (
        <Badge variant={row.isActive !== false ? 'success' : 'danger'}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer title="Users" description="Manage company users and roles">
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
      </div>
      {!isLoading && users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Invite team members to get started"
        />
      ) : (
        <>
          <DataTable columns={columns} data={users} keyExtractor={(r) => r.id} isLoading={isLoading} />
          {data?.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
        </>
      )}
    </PageContainer>
  );
}
