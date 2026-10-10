import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
	try {
		const { name } = await request.json();

		const cookieStore = cookies();

		(await cookieStore).delete(name);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.log(error);

		return NextResponse.json(
			{ success: false, error: 'Failed to delete cookie' },
			{ status: 500 }
		);
	}
}
