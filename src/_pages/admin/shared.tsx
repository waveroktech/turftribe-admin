import { format } from 'date-fns';
import { AlertTriangle, PlugZap, RefreshCw, ShieldOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SheetClose } from '@/components/ui/sheet';
import type { PaymentStatus } from '@/features/admin/types';

export { naira, compactNaira } from '../manager/payment-collection/ledger';

export const count = (value: number) => value.toLocaleString('en-NG');

export const shortDate = (value?: string | null) => (value ? format(new Date(value), 'd MMM yyyy') : '—');

export const dateTime = (value?: string | null) => (value ? format(new Date(value), 'd MMM yyyy, HH:mm') : '—');

export const fullName = (first?: string | null, last?: string | null) =>
	[first, last].filter(Boolean).join(' ') || 'Unnamed user';

type QueryError = { status?: number | string; data?: { message?: string } } | undefined;

/*
 * Why a backoffice section has nothing to show. A 404 means the /admin
 * endpoint isn't deployed yet (see docs/admin-backend-contract.md), which is
 * the expected state until the backend ships, so it reads as pending rather
 * than broken.
 */
export const AdminQueryState = ({
	error,
	endpoint,
	onRetry,
	className,
}: {
	error: unknown;
	endpoint: string;
	onRetry?: () => void;
	className?: string;
}) => {
	const status = (error as QueryError)?.status;
	const pending = status === 404;
	const denied = status === 401 || status === 403;

	const Icon = pending ? PlugZap : denied ? ShieldOff : AlertTriangle;
	const title = pending
		? 'Waiting on the backend'
		: denied
			? 'You don’t have access to this'
			: 'Couldn’t load this section';
	const info = pending
		? `${endpoint} isn’t live yet. This fills in once it ships.`
		: denied
			? 'Backoffice data is limited to platform admins.'
			: ((error as QueryError)?.data?.message ?? 'Something went wrong. Try again in a moment.');

	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-2 rounded-[20px] bg-surface-raised px-6 py-10 text-center ring-1 ring-black/[0.06]',
				className
			)}>
			<span className='grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-ink'>
				<Icon className='h-5 w-5' />
			</span>
			<p className='mt-1 text-sm font-bold text-ink'>{title}</p>
			<p className='max-w-sm text-xs text-subtle'>{info}</p>
			{!pending && !denied && onRetry && (
				<button
					onClick={onRetry}
					className='mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink/90'>
					<RefreshCw className='h-3.5 w-3.5' />
					Try again
				</button>
			)}
		</div>
	);
};

export const EmptyRows = ({ title, info }: { title: string; info: string }) => (
	<div className='flex flex-col items-center gap-1 rounded-[20px] bg-surface-raised px-6 py-10 text-center ring-1 ring-black/[0.06]'>
		<p className='text-sm font-bold text-ink'>{title}</p>
		<p className='text-xs text-subtle'>{info}</p>
	</div>
);

export const RowsSkeleton = ({ rows = 6 }: { rows?: number }) => (
	<div className='flex flex-col gap-2 rounded-[20px] bg-surface-raised p-4 ring-1 ring-black/[0.06]'>
		{Array.from({ length: rows }, (_, i) => (
			<Skeleton key={i} className='h-10 w-full' />
		))}
	</div>
);

export const KpiCard = ({
	title,
	icon,
	value,
	caption,
	highlight,
	loading,
}: {
	title: string;
	icon: React.ReactNode;
	value: string;
	caption?: string;
	highlight?: boolean;
	loading?: boolean;
}) => (
	<section
		className={cn(
			'flex min-w-0 flex-col gap-3 rounded-3xl border p-4 shadow-card',
			highlight ? 'border-ink bg-ink text-white' : 'border-black/[0.06] bg-surface-raised'
		)}>
		<div className='flex items-center gap-2.5'>
			<span
				className={cn(
					'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl [&_svg]:h-4 [&_svg]:w-4',
					highlight ? 'bg-brand text-ink' : 'bg-brand-soft text-ink'
				)}>
				{icon}
			</span>
			<h2 className={cn('truncate text-sm font-semibold', highlight ? 'text-white/70' : 'text-subtle')}>{title}</h2>
		</div>
		{loading ? (
			<Skeleton className='h-7 w-28' />
		) : (
			<p
				className={cn(
					'truncate text-2xl font-bold leading-none tracking-tight tabular-nums',
					highlight ? 'text-brand' : 'text-ink'
				)}>
				{value}
			</p>
		)}
		<p className={cn('text-xs', highlight ? 'text-white/60' : 'text-subtle')}>{loading ? ' ' : caption}</p>
	</section>
);

const TONES = {
	success: 'bg-success/10 text-success',
	danger: 'bg-danger/10 text-danger',
	warning: 'bg-warning/15 text-[#8A5A00]',
	neutral: 'bg-black/[0.05] text-subtle',
};

export const Pill = ({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) => (
	<span
		className={cn(
			'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
			TONES[tone]
		)}>
		{children}
	</span>
);

export const ALL = 'all';

// A compact filter dropdown; 'all' maps to no filter.
export const FilterSelect = <T extends string>({
	value,
	onChange,
	label,
	options,
}: {
	value: T | typeof ALL;
	onChange: (value: T | typeof ALL) => void;
	label: string;
	options: { value: T; label: string }[];
}) => (
	<Select value={value} onValueChange={(next) => onChange(next as T | typeof ALL)}>
		<SelectTrigger aria-label={label} className='h-11 w-auto min-w-[9rem] rounded-full border-line bg-white px-4 text-sm'>
			<SelectValue />
		</SelectTrigger>
		<SelectContent>
			<SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
			{options.map((option) => (
				<SelectItem key={option.value} value={option.value}>
					{option.label}
				</SelectItem>
			))}
		</SelectContent>
	</Select>
);

export const PAGE_SIZE = 20;

export const errorMessage = (error: unknown, fallback: string) =>
	(error as QueryError)?.data?.message || fallback;

export const inputClass =
	'mt-1.5 h-12 w-full rounded-xl border border-[#E7EAEE] bg-white px-4 text-sm text-primary-black outline-none focus:border-primary-black disabled:bg-[#F6F6F6] disabled:text-subtle';

export const cancelButtonClass =
	'h-12 flex-1 rounded-full bg-[#F6F6F6] text-sm font-medium text-primary-black hover:bg-[#EFEFEF]';

export const Toolbar = ({ children }: { children: React.ReactNode }) => (
	<div className='flex flex-wrap items-center gap-2 md:gap-3'>{children}</div>
);

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, keyof typeof TONES> = {
	success: 'success',
	pending: 'warning',
	failed: 'danger',
	refunded: 'neutral',
};

// globals.css hides lucide's X inside dialogs, so the sheet's own close icon
// never shows. This one is an inline SVG.
export const SheetCloseButton = () => (
	<SheetClose
		aria-label='Close'
		className='absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-black/[0.06] transition-colors hover:bg-[#EFEFEF]'>
		<svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden>
			<path d='M18 6 6 18M6 6l12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
		</svg>
	</SheetClose>
);
