'use client';

import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import * as RechartsPrimitive from 'recharts';
import {
	ArrowDownToLine,
	Building2,
	Landmark,
	Percent,
	Receipt,
	UserPlus,
	Users,
	Wallet,
} from 'lucide-react';
import { useGetAdminOverviewQuery } from '@/features/admin/adminApi';
import { AdminTrendPoint } from '@/features/admin/types';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { getSport } from '@/lib/sports';

import NavWrapper from '@/shared/nav-wrapper';
import Panel from '../../manager/dashboard/panel';
import { AdminQueryState, EmptyRows, KpiCard, compactNaira, count, naira } from '../shared';

const SERIES_COLOR = '#7FA81F';

type ChartPoint = AdminTrendPoint & { label: string; month: string };

const TrendTooltip = ({
	active,
	payload,
	metric,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & { metric: 'processed' | 'revenue' }) => {
	if (!active || !payload?.length) return null;
	const point = payload[0].payload as ChartPoint;

	return (
		<div className='min-w-[10rem] rounded-xl bg-ink px-3 py-2 shadow-lg'>
			<p className='text-[11px] font-medium text-white/60'>{point.month}</p>
			<p className='mt-1 flex justify-between gap-4 text-sm font-bold text-brand'>
				<span>{metric === 'processed' ? 'Processed' : 'Revenue'}</span>
				<span className='tabular-nums'>{naira(point[metric])}</span>
			</p>
			<p className='flex justify-between gap-4 text-xs text-white/70'>
				<span>New users</span>
				<span className='tabular-nums'>{count(point.newUsers)}</span>
			</p>
		</div>
	);
};

// One measure per chart: processed and revenue differ ~20x in scale, so they
// never share an axis.
const MonthlyChart = ({ points, metric }: { points: ChartPoint[]; metric: 'processed' | 'revenue' }) => {
	const config = {
		[metric]: { label: metric === 'processed' ? 'Processed' : 'Revenue', color: SERIES_COLOR },
	} satisfies ChartConfig;

	return (
		<ChartContainer config={config} className='aspect-auto h-[11rem] w-full'>
			<AreaChart data={points} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
				<defs>
					<linearGradient id={`admin-${metric}`} x1='0' y1='0' x2='0' y2='1'>
						<stop offset='0%' stopColor={SERIES_COLOR} stopOpacity={0.22} />
						<stop offset='100%' stopColor={SERIES_COLOR} stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} strokeDasharray='4 4' />
				<XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
				<YAxis
					tickLine={false}
					axisLine={false}
					width={64}
					fontSize={11}
					tickFormatter={(value: number) => compactNaira.format(value)}
				/>
				<ChartTooltip
					cursor={{ stroke: '#0C0C0C', strokeDasharray: '4 4' }}
					content={<TrendTooltip metric={metric} />}
				/>
				<Area
					dataKey={metric}
					type='monotone'
					stroke={SERIES_COLOR}
					strokeWidth={2}
					fill={`url(#admin-${metric})`}
					isAnimationActive={false}
					activeDot={{ r: 5, fill: SERIES_COLOR, stroke: '#fff', strokeWidth: 2 }}
				/>
			</AreaChart>
		</ChartContainer>
	);
};

const AdminDashboard = () => {
	const { data, error, isLoading, refetch } = useGetAdminOverviewQuery();

	const points: ChartPoint[] = (data?.trend ?? []).map((point) => ({
		...point,
		label: format(new Date(point.period), 'MMM'),
		month: format(new Date(point.period), 'MMMM yyyy'),
	}));
	const takeRate = data?.totalProcessed ? (data.totalRevenue / data.totalProcessed) * 100 : 0;

	return (
		<NavWrapper title='Platform overview'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4 md:gap-6'>
				{error ? (
					<AdminQueryState error={error} endpoint='GET /admin/overview' onRetry={refetch} />
				) : (
					<>
						<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4'>
							<KpiCard
								highlight
								loading={isLoading}
								title='Total revenue'
								icon={<Wallet />}
								value={naira(data?.totalRevenue ?? 0)}
								caption='Platform fees earned, all time'
							/>
							<KpiCard
								loading={isLoading}
								title='Total processed'
								icon={<ArrowDownToLine />}
								value={naira(data?.totalProcessed ?? 0)}
								caption={`Across ${count(data?.totalTransactions ?? 0)} payments`}
							/>
							<KpiCard
								loading={isLoading}
								title='Total users'
								icon={<Users />}
								value={count(data?.totalUsers ?? 0)}
								caption={`${count(data?.newUsersThisMonth ?? 0)} joined this month`}
							/>
							<KpiCard
								loading={isLoading}
								title='Communities'
								icon={<Building2 />}
								value={count(data?.totalCommunities ?? 0)}
								caption={`${count(data?.activeCommunities ?? 0)} active`}
							/>
						</div>

						<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4'>
							<KpiCard
								loading={isLoading}
								title='Paid out to managers'
								icon={<Landmark />}
								value={naira(data?.totalPaidOut ?? 0)}
								caption='Payouts settled, all time'
							/>
							<KpiCard
								loading={isLoading}
								title='Effective take rate'
								icon={<Percent />}
								value={`${takeRate.toFixed(1)}%`}
								caption='Revenue ÷ processed'
							/>
							<KpiCard
								loading={isLoading}
								title='Payments'
								icon={<Receipt />}
								value={count(data?.totalTransactions ?? 0)}
								caption='Successful transactions'
							/>
							<KpiCard
								loading={isLoading}
								title='New users this month'
								icon={<UserPlus />}
								value={count(data?.newUsersThisMonth ?? 0)}
								caption={format(new Date(), 'MMMM yyyy')}
							/>
						</div>

						<div className='grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-6'>
							<Panel title='Monthly volume' subtitle='Last 12 months'>
								{isLoading ? (
									<Skeleton className='h-[23rem] w-full' />
								) : points.length ? (
									<div className='flex flex-col gap-5'>
										<div>
											<p className='mb-1 text-xs font-semibold text-subtle'>Processed</p>
											<MonthlyChart points={points} metric='processed' />
										</div>
										<div>
											<p className='mb-1 text-xs font-semibold text-subtle'>Revenue</p>
											<MonthlyChart points={points} metric='revenue' />
										</div>
									</div>
								) : (
									<EmptyRows title='No payments yet' info='Monthly totals appear after the first payment.' />
								)}
							</Panel>

							<Panel title='Top communities' subtitle='By amount processed'>
								{isLoading ? (
									<Skeleton className='h-[23rem] w-full' />
								) : data?.topCommunities.length ? (
									<ol className='flex flex-col'>
										{data.topCommunities.map((community, index) => {
											const SportIcon = getSport(community.category).icon;
											return (
												<li
													key={community.id}
													className='flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0'>
													<span className='w-4 text-xs font-bold tabular-nums text-subtle'>{index + 1}</span>
													<span className='grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink'>
														<SportIcon className='h-4 w-4' />
													</span>
													<div className='min-w-0 flex-1'>
														<p className='truncate text-sm font-semibold capitalize text-ink'>{community.name}</p>
														<p className='text-xs text-subtle'>{naira(community.revenue)} revenue</p>
													</div>
													<span className='text-sm font-bold tabular-nums text-ink'>
														{compactNaira.format(community.processed)}
													</span>
												</li>
											);
										})}
									</ol>
								) : (
									<EmptyRows title='No activity yet' info='Communities show here once they take payments.' />
								)}
							</Panel>
						</div>
					</>
				)}
			</div>
		</NavWrapper>
	);
};

export default AdminDashboard;
