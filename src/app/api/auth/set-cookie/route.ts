import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
	try {
		const { name, value } = await request.json();

		const cookiestore = cookies();

		(await cookiestore).set(name, value, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.log(error);

		return NextResponse.json(
			{ success: false, error: 'Failed to set cookie' },
			{ status: 500 }
		);
	}
}
