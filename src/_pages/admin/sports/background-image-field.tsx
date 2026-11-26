import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImageUp, Loader2, Trash2 } from 'lucide-react';
import { useGetSportImageUploadUrlMutation } from '@/features/admin/adminApi';
import { cn } from '@/lib/utils';

import { errorMessage } from '../shared';

// Mirrors the backend's ALLOWED_IMAGE_CONTENT_TYPES and MAX_SPORT_IMAGE_BYTES.
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Picks a background image and uploads it straight away: ask the backend for a
 * presigned url, PUT the file to S3, then hand back the public fileUrl. The
 * sport only points at the new image once the admin saves.
 */
const BackgroundImageField = ({
	value,
	onChange,
	onUploadingChange,
	sportName,
}: {
	value: string | null;
	onChange: (url: string | null) => void;
	onUploadingChange: (uploading: boolean) => void;
	sportName: string;
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [getUploadUrl] = useGetSportImageUploadUrlMutation();

	const setBusy = (busy: boolean) => {
		setUploading(busy);
		onUploadingChange(busy);
	};

	const upload = async (file: File) => {
		const contentType = file.type.toLowerCase();
		if (!ALLOWED_TYPES.includes(contentType)) {
			toast.error('Use a JPEG, PNG, WebP or AVIF image.');
			return;
		}
		if (file.size > MAX_BYTES) {
			toast.error('Images must be 10 MB or smaller.');
			return;
		}

		setBusy(true);
		try {
			const presigned = await getUploadUrl({ fileName: file.name, contentType }).unwrap();
			const res = await fetch(presigned.uploadUrl, {
				method: presigned.method,
				headers: presigned.headers,
				body: file,
			});
			if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
			onChange(presigned.fileUrl);
		} catch (err) {
			toast.error(errorMessage(err, err instanceof Error ? err.message : 'Couldn’t upload the image.'));
		} finally {
			setBusy(false);
		}
	};

	return (
		<section className='flex flex-col gap-2'>
			<div>
				<h3 className='text-sm font-bold text-ink'>Background image</h3>
				<p className='text-xs text-subtle'>JPEG, PNG, WebP or AVIF, up to 10 MB. Shown behind the sport in the app.</p>
			</div>

			<div
				className={cn(
					'relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-[#E7EAEE] bg-white',
					!value && 'border-dashed'
				)}>
				{value ? (
					// eslint-disable-next-line @next/next/no-img-element -- S3 bucket host varies by environment
					<img src={value} alt={`${sportName || 'Sport'} background`} className='h-full w-full object-cover' />
				) : (
					<button
						type='button'
						disabled={uploading}
						onClick={() => inputRef.current?.click()}
						className='flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-subtle hover:bg-black/[0.02]'>
						<ImageUp className='h-6 w-6' />
						Choose an image
					</button>
				)}
				{uploading && (
					<div className='absolute inset-0 grid place-items-center bg-white/70'>
						<span className='inline-flex items-center gap-2 text-sm font-medium text-ink'>
							<Loader2 className='h-4 w-4 animate-spin' />
							Uploading…
						</span>
					</div>
				)}
			</div>

			{value && (
				<div className='flex gap-2'>
					<button
						type='button'
						disabled={uploading}
						onClick={() => inputRef.current?.click()}
						className='inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50'>
						<ImageUp className='h-3.5 w-3.5' />
						Replace
					</button>
					<button
						type='button'
						disabled={uploading}
						onClick={() => onChange(null)}
						className='inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-danger hover:text-danger disabled:opacity-50'>
						<Trash2 className='h-3.5 w-3.5' />
						Remove
					</button>
				</div>
			)}

			<input
				ref={inputRef}
				type='file'
				accept={ALLOWED_TYPES.join(',')}
				className='hidden'
				onChange={(e) => {
					const file = e.target.files?.[0];
					// Reset so picking the same file again still fires onChange.
					e.target.value = '';
					if (file) upload(file);
				}}
			/>
		</section>
	);
};

export default BackgroundImageField;
