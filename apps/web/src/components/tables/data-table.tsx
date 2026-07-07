'use client';

import { ReactNode } from 'react';
import { TableSkeleton } from '@/components/shared/loading-state';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
}

export function DataTable<T>({ columns, data, keyExtractor, isLoading }: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={8} columns={columns.length || 4} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-warm bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-warm bg-canvas">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left font-medium text-muted ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="border-b border-border-warm/70 last:border-0 hover:bg-canvas/60"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-ink ${col.className ?? ''}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
