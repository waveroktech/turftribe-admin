import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useCreateSportMutation, useUpdateSportMutation } from '@/features/admin/adminApi';
import { AdminSport, SportFormat, SportInput, SportPosition, SportStat } from '@/features/admin/types';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import LoadingButton from '@/components/ui/loading-button';
import { SheetCloseButton, cancelButtonClass, errorMessage } from '../shared';
import { BLANK_SPORT, SPORT_TEMPLATES, slugify } from './templates';

export const MAX_HEADLINE_STATS = 3;

const cellInput =
	'h-10 w-full min-w-0 rounded-lg border border-[#E7EAEE] bg-white px-3 text-sm text-primary-black outline-none focus:border-primary-black';

const numberOrNull = (value: string) => (value === '' ? null : Math.max(0, Number(value)));

// Stat keys match how managers' stat categories are stored: the lower-cased title.
const statKeyFor = (label: string) => label.trim().toLowerCase();

const Section = ({
	title,
	hint,
	onAdd,
	addLabel,
	children,
}: {
	title: string;
	hint: string;
	onAdd: () => void;
	addLabel: string;
	children: React.ReactNode;
}) => (
	<section className='flex flex-col gap-2'>
		<div className='flex items-end justify-between gap-3'>
			<div>
				<h3 className='text-sm font-bold text-ink'>{title}</h3>
				<p className='text-xs text-subtle'>{hint}</p>
			</div>
			<button
				type='button'
				onClick={onAdd}
				className='inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90'>
				<Plus className='h-3.5 w-3.5' />
				{addLabel}
			</button>
		</div>
		{children}
	</section>
);

const RemoveButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
	<button
		type='button'
		onClick={onClick}
		aria-label={label}
		className='grid h-10 w-10 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-danger/10 hover:text-danger'>
		<Trash2 className='h-4 w-4' />
	</button>
);

const NoRows = ({ children }: { children: React.ReactNode }) => (
	<p className='rounded-xl border border-dashed border-[#E7EAEE] px-4 py-3 text-xs text-subtle'>{children}</p>
);

const validate = (draft: SportInput, takenKeys: string[]) => {
	const statKeys = draft.stats.map((stat) => stat.key);
	if (!draft.name.trim()) return 'Give the sport a name.';
	if (!draft.key) return 'Give the sport a key.';
	if (takenKeys.includes(draft.key)) return `Another sport already uses the key “${draft.key}”.`;
	if (draft.formats.some((format) => !format.name.trim())) return 'Every game format needs a name.';
	if (draft.stats.some((stat) => !stat.label.trim() || !stat.short.trim())) return 'Every stat needs a name and a short code.';
	if (new Set(statKeys).size !== statKeys.length) return 'Two stats have the same name.';
	if (draft.stats.filter((stat) => stat.headline).length > MAX_HEADLINE_STATS)
		return `Pick at most ${MAX_HEADLINE_STATS} headline stats.`;
	if (draft.positions.some((position) => !position.name.trim() || !position.code.trim()))
		return 'Every position needs a name and a code.';
	return null;
};

const SportEditor = ({
	sport,
	sports,
	onClose,
}: {
	/** null creates a new sport. */
	sport: AdminSport | null;
	sports: AdminSport[];
	onClose: () => void;
}) => {
	const editing = !!sport;
	const [draft, setDraft] = useState<SportInput>(() =>
		sport
			? {
					key: sport.key,
					name: sport.name,
					isActive: sport.isActive,
					formats: sport.formats,
					stats: sport.stats,
					positions: sport.positions,
				}
			: BLANK_SPORT
	);
	// A new sport's key follows its name until the admin edits the key itself.
	const [keyTouched, setKeyTouched] = useState(editing);

	const [createSport, { isLoading: creating }] = useCreateSportMutation();
	const [updateSport, { isLoading: updating }] = useUpdateSportMutation();

	const takenKeys = sports.filter((other) => other.id !== sport?.id).map((other) => other.key);
	const unusedTemplates = SPORT_TEMPLATES.filter((template) => !takenKeys.includes(template.key));
	const error = validate(draft, takenKeys);
	const headlineCount = draft.stats.filter((stat) => stat.headline).length;

	const set = <K extends keyof SportInput>(field: K, value: SportInput[K]) =>
		setDraft((current) => ({ ...current, [field]: value }));

	const updateRow = <T,>(field: 'formats' | 'stats' | 'positions', index: number, patch: Partial<T>) =>
		setDraft((current) => ({
			...current,
			[field]: (current[field] as T[]).map((row, i) => (i === index ? { ...row, ...patch } : row)),
		}));

	const removeRow = (field: 'formats' | 'stats' | 'positions', index: number) =>
		setDraft((current) => ({
			...current,
			[field]: (current[field] as unknown[]).filter((_, i) => i !== index),
		}));

	const save = async () => {
		const body: SportInput = {
			...draft,
			name: draft.name.trim(),
			formats: draft.formats.map((format) => ({ ...format, name: format.name.trim() })),
			stats: draft.stats.map((stat) => ({
				...stat,
				label: stat.label.trim(),
				short: stat.short.trim().toUpperCase(),
				unit: stat.unit?.trim() || null,
			})),
			positions: draft.positions.map((position) => ({
				name: position.name.trim(),
				code: position.code.trim().toUpperCase(),
			})),
		};
		try {
			if (sport) await updateSport({ id: sport.id, body }).unwrap();
			else await createSport(body).unwrap();
			toast.success(`${body.name} ${editing ? 'updated' : 'added'}.`);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the sport.'));
		}
	};

	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent className='flex w-full flex-col gap-0 overflow-hidden bg-[#F7F7F7] p-0 sm:max-w-2xl'>
				<SheetCloseButton />
				<div className='flex-1 overflow-y-auto p-6'>
					<SheetTitle className='pr-10 text-lg font-bold text-ink'>{editing ? `Edit ${sport.name}` : 'Add a sport'}</SheetTitle>
					<SheetDescription className='text-sm text-subtle'>
						Communities pick a sport when they’re created; its formats, stats and positions shape their games
						and leaderboards.
					</SheetDescription>

					<div className='mt-6 flex flex-col gap-7'>
						{!editing && unusedTemplates.length > 0 && (
							<section className='flex flex-col gap-2'>
								<h3 className='text-sm font-bold text-ink'>Start from a template</h3>
								<div className='flex flex-wrap gap-2'>
									{unusedTemplates.map((template) => (
										<button
											key={template.key}
											type='button'
											onClick={() => {
												setDraft(template);
												setKeyTouched(true);
											}}
											className={cn(
												'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
												draft.key === template.key
													? 'border-ink bg-ink text-white'
													: 'border-line bg-white text-ink hover:border-ink'
											)}>
											{template.name}
										</button>
									))}
								</div>
							</section>
						)}

						<section className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end'>
							<label className='text-sm font-medium text-neutral-700'>
								Name
								<input
									value={draft.name}
									onChange={(e) => {
										const name = e.target.value;
										setDraft((current) => ({ ...current, name, key: keyTouched ? current.key : slugify(name) }));
									}}
									placeholder='e.g. Volleyball'
									className={cn(cellInput, 'mt-1.5 h-12 rounded-xl px-4')}
								/>
							</label>
							<label className='text-sm font-medium text-neutral-700'>
								Key
								<input
									value={draft.key}
									disabled={editing}
									onChange={(e) => {
										setKeyTouched(true);
										set('key', slugify(e.target.value));
									}}
									placeholder='volleyball'
									className={cn(
										cellInput,
										'mt-1.5 h-12 rounded-xl px-4 font-mono disabled:bg-[#F6F6F6] disabled:text-subtle'
									)}
								/>
							</label>
							<label className='flex h-12 items-center gap-2 text-sm font-medium text-neutral-700'>
								<Switch checked={draft.isActive} onCheckedChange={(checked) => set('isActive', checked)} />
								Active
							</label>
							{editing && (
								<p className='text-xs text-subtle sm:col-span-3'>
									The key is stored on every community of this sport, so it can’t change.
								</p>
							)}
						</section>

						<Section
							title='Game formats'
							hint='The kinds of game a manager can create. Leave players per side blank for individual events.'
							addLabel='Format'
							onAdd={() =>
								set('formats', [...draft.formats, { name: '', playersPerSide: null, durationMinutes: null }])
							}>
							{draft.formats.length ? (
								<div className='flex flex-col gap-2'>
									<div className='hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-subtle sm:grid'>
										<span>Format</span>
										<span>Players / side</span>
										<span>Minutes</span>
									</div>
									{draft.formats.map((format, index) => (
										<div
											key={index}
											className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]'>
											<input
												aria-label='Format name'
												value={format.name}
												onChange={(e) => updateRow<SportFormat>('formats', index, { name: e.target.value })}
												placeholder='e.g. 5-a-side'
												className={cn(cellInput, 'col-span-2 sm:col-span-1')}
											/>
											<input
												aria-label='Players per side'
												type='number'
												min={1}
												value={format.playersPerSide ?? ''}
												onChange={(e) =>
													updateRow<SportFormat>('formats', index, { playersPerSide: numberOrNull(e.target.value) })
												}
												placeholder='Players'
												className={cellInput}
											/>
											<input
												aria-label='Duration in minutes'
												type='number'
												min={1}
												value={format.durationMinutes ?? ''}
												onChange={(e) =>
													updateRow<SportFormat>('formats', index, { durationMinutes: numberOrNull(e.target.value) })
												}
												placeholder='Minutes'
												className={cellInput}
											/>
											<RemoveButton label={`Remove ${format.name || 'format'}`} onClick={() => removeRow('formats', index)} />
										</div>
									))}
								</div>
							) : (
								<NoRows>No formats yet.</NoRows>
							)}
						</Section>

						<Section
							title='Stats'
							hint={`What managers record after a game. Star up to ${MAX_HEADLINE_STATS} headline stats for player cards and leaderboards.`}
							addLabel='Stat'
							onAdd={() =>
								set('stats', [...draft.stats, { key: '', label: '', short: '', unit: null, headline: false }])
							}>
							{draft.stats.length ? (
								<div className='flex flex-col gap-2'>
									<div className='hidden grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-subtle sm:grid'>
										<span />
										<span>Stat</span>
										<span>Code</span>
										<span>Unit</span>
									</div>
									{draft.stats.map((stat, index) => {
										const starDisabled = !stat.headline && headlineCount >= MAX_HEADLINE_STATS;
										return (
											<div
												key={index}
												className='grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 sm:grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]'>
												<button
													type='button'
													aria-pressed={stat.headline}
													aria-label={stat.headline ? 'Remove from headline stats' : 'Make a headline stat'}
													title={starDisabled ? `Only ${MAX_HEADLINE_STATS} headline stats` : 'Headline stat'}
													disabled={starDisabled}
													onClick={() => updateRow<SportStat>('stats', index, { headline: !stat.headline })}
													className={cn(
														'grid h-10 w-10 place-items-center rounded-lg transition-colors disabled:opacity-30',
														stat.headline ? 'text-[#C99A00]' : 'text-subtle hover:bg-black/[0.05]'
													)}>
													<Star className='h-4 w-4' fill={stat.headline ? 'currentColor' : 'none'} />
												</button>
												<input
													aria-label='Stat name'
													value={stat.label}
													onChange={(e) =>
														updateRow<SportStat>('stats', index, {
															label: e.target.value,
															key: statKeyFor(e.target.value),
														})
													}
													placeholder='e.g. Goals'
													className={cn(cellInput, 'col-span-2 sm:col-span-1')}
												/>
												<input
													aria-label='Short code'
													value={stat.short}
													maxLength={4}
													onChange={(e) => updateRow<SportStat>('stats', index, { short: e.target.value.toUpperCase() })}
													placeholder='GLS'
													className={cn(cellInput, 'col-start-2 uppercase sm:col-start-auto')}
												/>
												<input
													aria-label='Unit'
													value={stat.unit ?? ''}
													maxLength={8}
													onChange={(e) => updateRow<SportStat>('stats', index, { unit: e.target.value })}
													placeholder='Unit'
													className={cellInput}
												/>
												<RemoveButton
													label={`Remove ${stat.label || 'stat'}`}
													onClick={() => removeRow('stats', index)}
												/>
											</div>
										);
									})}
								</div>
							) : (
								<NoRows>No stats yet.</NoRows>
							)}
						</Section>

						<Section
							title='Positions'
							hint='Roles players pick on their profile. Leave empty for sports without positions, like running.'
							addLabel='Position'
							onAdd={() => set('positions', [...draft.positions, { name: '', code: '' }])}>
							{draft.positions.length ? (
								<div className='flex flex-col gap-2'>
									{draft.positions.map((position, index) => (
										<div key={index} className='grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_2.5rem] gap-2'>
											<input
												aria-label='Position name'
												value={position.name}
												onChange={(e) => updateRow<SportPosition>('positions', index, { name: e.target.value })}
												placeholder='e.g. Goalkeeper'
												className={cellInput}
											/>
											<input
												aria-label='Position code'
												value={position.code}
												maxLength={4}
												onChange={(e) =>
													updateRow<SportPosition>('positions', index, { code: e.target.value.toUpperCase() })
												}
												placeholder='GK'
												className={cn(cellInput, 'uppercase')}
											/>
											<RemoveButton
												label={`Remove ${position.name || 'position'}`}
												onClick={() => removeRow('positions', index)}
											/>
										</div>
									))}
								</div>
							) : (
								<NoRows>No positions.</NoRows>
							)}
						</Section>
					</div>
				</div>

				<footer className='flex flex-col gap-2 border-t border-line bg-white p-4'>
					{error && <p className='text-xs text-danger'>{error}</p>}
					<div className='flex gap-3'>
						<button type='button' onClick={onClose} className={cancelButtonClass}>
							Cancel
						</button>
						<LoadingButton
							variant='secondary'
							loading={creating || updating}
							disabled={!!error}
							onClick={save}
							className='flex-1'>
							{editing ? 'Save changes' : 'Add sport'}
						</LoadingButton>
					</div>
				</footer>
			</SheetContent>
		</Sheet>
	);
};

export default SportEditor;
