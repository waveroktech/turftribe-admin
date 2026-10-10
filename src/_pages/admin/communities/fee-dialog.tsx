import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdateCommunityCommissionMutation } from '@/features/admin/adminApi';
import { AdminCommunity, CommunityCommission } from '@/features/admin/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

import LoadingButton from '@/components/ui/loading-button';
import { cancelButtonClass, errorMessage, inputClass, naira } from '../shared';

export const describeFee = (commission: CommunityCommission | null) =>
	commission ? `${naira(commission.platformFee)} per booking` : 'Not set';

const FeeDialog = ({ community, onClose }: { community: AdminCommunity; onClose: () => void }) => {
	const current = community.commission;
	const [platformFee, setPlatformFee] = useState(current ? String(current.platformFee) : '');
	const [updateCommission, { isLoading }] = useUpdateCommunityCommissionMutation();

	const fee = Number(platformFee);
	const invalid = platformFee === '' || Number.isNaN(fee) || fee < 0;

	const save = async () => {
		try {
			await updateCommission({ id: community.id, commission: { platformFee: fee } }).unwrap();
			toast.success(`Fee for ${community.name} is now ${naira(fee)} per booking.`);
			onClose();
		} catch (error) {
			toast.error(errorMessage(error, 'Couldn’t update the fee.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-w-md rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>
					Fee for <span className='capitalize'>{community.name}</span>
				</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					The flat amount TurfTribe keeps from every booking in this community, including bookings a
					manager records by hand. Currently:{' '}
					<span className='font-medium text-primary-black'>{describeFee(current)}</span>.
				</DialogDescription>

				{!current && (
					<p className='rounded-2xl bg-danger/10 px-4 py-3 text-xs text-danger'>
						This community has no fee set, so its bookings fail at checkout until one is saved.
					</p>
				)}

				<label className='block text-sm font-medium text-neutral-700'>
					Fee per booking (₦)
					<input
						type='number'
						inputMode='decimal'
						min={0}
						step={50}
						value={platformFee}
						onChange={(e) => setPlatformFee(e.target.value)}
						placeholder='e.g. 200'
						className={inputClass}
					/>
					{invalid && platformFee !== '' && (
						<span className='mt-1 block text-xs text-danger'>Enter ₦0 or more.</span>
					)}
				</label>

				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='secondary' loading={isLoading} disabled={invalid} onClick={save} className='flex-1'>
						Save fee
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FeeDialog;
