import { Briefcase, Building2, ExternalLink, IdCard, Mail } from 'lucide-react';
import { ZohoPeopleEmployee } from '@/services/zoho-people.service';

interface ZohoPeopleEmployeeListProps {
  employees: ZohoPeopleEmployee[];
}

function EmployeeCard({ employee }: { employee: ZohoPeopleEmployee }) {
  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-base font-semibold text-ink">{employee.name}</h3>
          <div className="space-y-1.5 text-sm text-muted">
            {employee.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {employee.employeeId && (
              <div className="flex items-center gap-2">
                <IdCard className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{employee.employeeId}</span>
              </div>
            )}
            {employee.department && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{employee.department}</span>
              </div>
            )}
            {employee.designation && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{employee.designation}</span>
              </div>
            )}
          </div>
        </div>

        {employee.webUrl && (
          <a
            href={employee.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-brand hover:text-brand-hover"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        )}
      </div>
    </article>
  );
}

export function ZohoPeopleEmployeeList({
  employees,
}: ZohoPeopleEmployeeListProps) {
  return (
    <div className="space-y-3">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
