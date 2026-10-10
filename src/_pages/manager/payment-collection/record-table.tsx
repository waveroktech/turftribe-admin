import { cn } from '@/lib/utils';

export type Column<T> = {
	key: string;
	header: string;
	cell: (row: T) => React.ReactNode;
	align?: 'left' | 'right';
	className?: string;
	// Totals footer value for this column, if it has one.
	total?: React.ReactNode;
};

type RecordTableProps<T> = {
	rows: T[];
	columns: Column<T>[];
	rowKey: (row: T) => string;
	// Phone layout: a title line, a meta line, and a right-hand value.
	mobile: (row: T) => { title: React.ReactNode; meta: React.ReactNode; value: React.ReactNode; extra?: React.ReactNode };
	totalLabel?: string;
};

function RecordTable<T>({ rows, columns, rowKey, mobile, totalLabel = 'Total' }: RecordTableProps<T>) {
	const hasTotals = columns.some((column) => column.total !== undefined);

	return (
		<>
			{/* Phones */}
			<ul className='overflow-hidden rounded-[20px] bg-surface-raised ring-1 ring-black/[0.06] md:hidden'>
				{rows.map((row) => {
					const item = mobile(row);
					return (
						<li key={rowKey(row)} className='border-b border-line/70 px-3.5 py-3 last:border-b-0'>
							<div className='flex items-start justify-between gap-3'>
								<div className='min-w-0'>
									<p className='truncate text-sm font-bold capitalize text-ink'>{item.title}</p>
									<p className='mt-0.5 text-xs text-subtle'>{item.meta}</p>
								</div>
								<div className='shrink-0 text-right text-sm font-bold tabular-nums text-ink'>{item.value}</div>
							</div>
							{item.extra && <div className='mt-2.5'>{item.extra}</div>}
						</li>
					);
				})}
			</ul>

			{/* Tablet and up */}
			<div className='hidden overflow-x-auto rounded-[20px] bg-surface-raised ring-1 ring-black/[0.06] md:block'>
				<table className='w-full min-w-[44rem] border-collapse text-sm'>
					<thead>
						<tr className='border-b border-line bg-surface/60'>
							{columns.map((column) => (
								<th
									key={column.key}
									scope='col'
									className={cn(
										'whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-subtle',
										column.align === 'right' ? 'text-right' : 'text-left'
									)}>
									{column.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={rowKey(row)} className='border-b border-line/60 transition-colors last:border-b-0 hover:bg-surface/60'>
								{columns.map((column) => (
									<td
										key={column.key}
										className={cn(
											'whitespace-nowrap px-4 py-3 text-ink',
											column.align === 'right' && 'text-right tabular-nums',
											column.className
										)}>
										{column.cell(row)}
									</td>
								))}
							</tr>
						))}
					</tbody>
					{hasTotals && (
						<tfoot>
							<tr className='border-t-2 border-line bg-surface/60 font-bold'>
								{columns.map((column, i) => (
									<td
										key={column.key}
										className={cn(
											'whitespace-nowrap px-4 py-3 text-ink',
											column.align === 'right' && 'text-right tabular-nums'
										)}>
										{i === 0 ? totalLabel : column.total ?? ''}
									</td>
								))}
							</tr>
						</tfoot>
					)}
				</table>
			</div>
		</>
	);
}

export default RecordTable;
