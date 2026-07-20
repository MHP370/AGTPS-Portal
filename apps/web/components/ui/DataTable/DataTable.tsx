import { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  title: string;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "اطلاعاتی یافت نشد.",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
      <table className="w-full">
       <thead className="bg-slate-800/40">
  <tr>
    {columns.map((column) => (
      <th
        key={`head-${String(column.key)}`}
        className="px-6 py-4 text-right font-medium"
      >
        {column.title}
      </th>
    ))}
  </tr>
</thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className="border-t border-slate-800 transition hover:bg-slate-800/40"
              >
                {columns.map((column) => (
                  <td
                    key={`cell-${index}-${String(column.key)}`}
                    className={`px-6 py-5 ${column.className ?? ""}`}
                  >
                    {column.render
                      ? column.render(row)
                      : String(
                          (row as Record<string, unknown>)[
                            String(column.key)
                          ] ?? "",
                        )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
