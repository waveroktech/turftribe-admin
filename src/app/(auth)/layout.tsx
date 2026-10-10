'use client';

import Image from 'next/image';

const Layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<main className='fixed inset-0 flex items-center md:justify-center overflow-y-auto overscroll-none bg-[url(/images/auth-bg.webp)] bg-cover bg-center md:static md:inset-auto md:overscroll-auto md:bg-auto'>
			<div className='max-w-[34.813rem] w-full my-auto py-4 px-4 md:py-8 md:h-[90vh] flex flex-col-reverse md:flex-col'>
				<div className='flex items-center justify-center mt-4 md:mt-0 md:mb-8'>
					<Image
						src='/icons/logo-green.svg'
						width={156.9}
						height={24}
						alt='turftribe logo in green'
					/>
				</div>
				{children}
			</div>
		</main>
	);
};

export default Layout;
