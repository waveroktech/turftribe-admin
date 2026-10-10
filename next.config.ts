import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'i.postimg.cc',
			},
			{
				protocol: 'https',
				hostname: 'melospin.s3.eu-north-1.amazonaws.com',
			},
		],
	},
};

export default nextConfig;
