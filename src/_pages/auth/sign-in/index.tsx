'use client';

import { useForm } from 'react-hook-form';
import { useLoginMutation } from '@/features/auth/authApi';
import { useAppDispatch } from '@/lib/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { setUser } from '@/features/auth/authSlice';
import { isSuperAdmin, setAuthCookie } from '@/lib/auth';
import { icons } from '@/components/icons/icons';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { ADMIN_HOME } from '@/lib/admin';

import AppInput from '@/components/ui/app-input';
import LoadingButton from '@/components/ui/loading-button';

const SignIn = () => {
	const dispatch = useAppDispatch();

	const formSchema = z.object({
		email: z.string().email(),
		password: z.string().min(8, {
			message: 'Password must be at least 8 characters',
		}),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const [login, { isLoading }] = useLoginMutation();

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		try {
			const res = await login(data).unwrap();

			// Only superadmins get a session here. The backend rejects
			// everyone else's backoffice requests regardless.
			if (!isSuperAdmin(res?.data)) {
				toast.error("This account doesn't have backoffice access.");
				return;
			}

			await setAuthCookie('access-token', res?.data?.token);
			localStorage.setItem('access-token', res?.data?.token);

			const userClone = { ...res?.data };
			delete userClone?.token;

			dispatch(setUser(userClone));
			window.location.replace(ADMIN_HOME);
		} catch (error: any) {
			toast.error(error?.data?.message);
		}
	};

	return (
		<div className='bg-white py-6 md:py-10 px-3 rounded-[16px] shadow-auth'>
			<div className='border-b border-b-[#5258660D] border-solid pb-5 flex flex-col items-center text-center fgap-2'>
				<h1 className='text-[#424242] text-[1.25rem] font-bold'>Log in</h1>
				<p className='text-sm text-[#424242]'>TurfTribe backoffice</p>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className='border-b border-b-[#5258660D] border-solid pb-12'>
						<div className='max-w-[19.5rem] w-full mx-auto'>
							<AppInput
								form={form}
								label='Email Address'
								name='email'
								placeholder='Enter a valid email address'
								icon={icons.Mail}
							/>
							<div className='mt-6' />
							<AppInput
								form={form}
								label='Password'
								name='password'
								placeholder='Enter account password'
								icon={icons.Lock}
								className='-mt-4'
							/>
						</div>
					</div>

					<div className='max-w-[19.5rem] w-full mx-auto mt-4'>
						<LoadingButton
							variant='secondary'
							loading={isLoading}
							className='w-full'>
							Log in
							<svg
								width='16'
								height='17'
								viewBox='0 0 16 17'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'>
								<path
									d='M3.3335 8.9694H12.6668M12.6668 8.9694L8.00016 4.30273M12.6668 8.9694L8.00016 13.6361'
									stroke='#CEEE6F'
									strokeWidth='1.33333'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
						</LoadingButton>
						<p className='text-center text-[#424242] text-xs mt-4'>
							Version 1.0 - {new Date().getFullYear()}
						</p>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default SignIn;