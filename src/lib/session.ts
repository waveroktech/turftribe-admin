'use server';

import { cookies } from 'next/headers';

export async function setUserToken(name: string, token: string) {
	const cookiestore = cookies();

	(await cookiestore).set(name, token, {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: 60 * 60 * 24,
	});
}

export async function getUserToken(name: string) {
	const cookiestore = cookies();

	const token = (await cookiestore).get(name)?.value;

	return token;
}

export async function deleteUserToken(name: string) {
	const cookiestore = cookies();

	(await cookiestore).delete(name);
}
