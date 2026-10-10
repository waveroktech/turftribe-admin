import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LenisOptions } from 'lenis';
import { icons } from '@/components/icons/icons';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const scrollOptions: LenisOptions = {
	orientation: 'vertical',
	gestureOrientation: 'vertical',
	smoothWheel: true,
	wheelMultiplier: 0.7,
	touchMultiplier: 1,
	infinite: false,
};

export const isToday = (date: Date) => {
	const today = new Date();
	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	);
};

export const isTomorrow = (date: Date) => {
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);

	return (
		date.getFullYear() === tomorrow.getFullYear() &&
		date.getMonth() === tomorrow.getMonth() &&
		date.getDate() === tomorrow.getDate()
	);
};

export function capitalizeWords(str: string) {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatTimeUTC(dateInput: string | Date): string {
	const date = new Date(dateInput);
	const hours = date.getUTCHours().toString().padStart(2, '0');
	const minutes = date.getUTCMinutes().toString().padStart(2, '0');
	// const seconds = date.getUTCSeconds().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
}

export const STATICONS = {
	cleansheets: icons.CleanSheets,
	cleansheet: icons.CleanSheets,
	goals: icons.Goals,
	passes: icons.Assists,
	assists: icons.Assists,
};
