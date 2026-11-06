import { toast } from 'sonner';
import { useGetPlacementsQuery, useUpdatePlacementMutation } from '@/features/merch/merchApi';
import type { PlacementKey } from '@/features/merch/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import { AdminQueryState, RowsSkeleton, errorMessage } from '../../shared';
import { PLACEMENTS } from '../shared';

// Global on/off for each promo slot in the player app. A product still has to
// be live and opted in to a slot (in its editor) to appear there.
const PlacementsDialog = ({ onClose }: { onClose: () => void }) => {
	const { data: placements = [], error, isLoading, refetch } = useGetPlacementsQuery();
	const [updatePlacement, { isLoading: saving, originalArgs }] = useUpdatePlacementMutation();

	const enabled = (key: PlacementKey) => placements.find((p) => p.key === key)?.enabled ?? false;

	const change = async (key: PlacementKey, next: boolean) => {
		try {
			await updatePlacement({ key, enabled: next }).unwrap();
			toast.success(`${PLACEMENTS.find((p) => p.key === key)?.label} turned ${next ? 'on' : 'off'}.`);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t update the placement.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-w-lg rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>Placements</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					Where merch is promoted in the player app. Merch only shows after a payment is confirmed, never
					during it, and at most one placement shows per screen. The Shop page is always on.
				</DialogDescription>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /merch/placements' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton rows={4} />
				) : (
					<ul className='flex flex-col divide-y divide-line/70 rounded-2xl ring-1 ring-black/[0.06]'>
						{PLACEMENTS.map((placement) => (
							<li key={placement.key} className='flex items-start justify-between gap-4 px-4 py-3'>
								<div>
									<p className='text-sm font-semibold text-ink'>{placement.label}</p>
									<p className='text-xs text-subtle'>{placement.info}</p>
								</div>
								<Switch
									checked={enabled(placement.key)}
									disabled={saving && originalArgs?.key === placement.key}
									onCheckedChange={(next) => change(placement.key, next)}
									aria-label={`${placement.label} placement`}
								/>
							</li>
						))}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default PlacementsDialog;
