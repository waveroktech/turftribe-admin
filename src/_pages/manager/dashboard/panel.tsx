import { cn } from '@/lib/utils';

type PanelProps = {
	title: string;
	subtitle?: string;
	action?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
};

// The card shell every dashboard section sits in.
const Panel = ({ title, subtitle, action, className, children }: PanelProps) => (
	<section
		className={cn(
			'flex min-w-0 flex-col rounded-3xl border border-black/[0.06] bg-surface-raised p-4 shadow-card md:p-5',
			className
		)}>
		<header className='mb-4 flex flex-wrap items-start justify-between gap-3'>
			<div>
				<h2 className='text-base font-bold text-ink'>{title}</h2>
				{subtitle && <p className='mt-0.5 text-xs text-subtle'>{subtitle}</p>}
			</div>
			{action}
		</header>
		{children}
	</section>
);

export default Panel;
