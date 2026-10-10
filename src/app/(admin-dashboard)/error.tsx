'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorScreen() {
	const router = useRouter();

	const handleRetry = () => {
		router.refresh();
	};

	return (
		<div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
			<div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center'>
				<div className='mb-6'>
					<AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
					<h1 className='text-2xl font-bold text-gray-800 mb-2'>
						Oops! Something went wrong
					</h1>
					<p className='text-gray-600 leading-relaxed'>
						We encountered an unexpected error. Don&apos;t worry, it&apos;s not your
						fault. Please try again in a moment.
					</p>
				</div>

				<Button onClick={handleRetry} variant={'primary'}>
					<RefreshCw className='w-4 h-4 mr-2' />
					Try Again
				</Button>

				<p className='mt-4 text-sm text-gray-500'>
					If the problem persists, please contact support.
				</p>
			</div>
		</div>
	);
}
