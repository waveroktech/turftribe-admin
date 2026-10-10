'use client';

import { ChangeEventHandler, useEffect, useState } from 'react';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from './input';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from './label';

interface InputProps<TFieldValues extends FieldValues> {
	form?: UseFormReturn<TFieldValues>;
	name: Path<TFieldValues>;
	label?: string;
	icon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	placeholder: string;
	password?: boolean;
	className?: string;
	value?: string;
	onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
	numericOnly?: boolean;
	disabled?: boolean;
}

const AppInput = <TFieldValues extends FieldValues>({
	form,
	name,
	label,
	icon,
	placeholder,
	className,
	rightIcon,
	numericOnly,
	disabled
}: InputProps<TFieldValues>) => {
	const [touched, setTouched] = useState(false);
	const [showPwd, setShowPwd] = useState(false);

	const val = form?.watch(name);

	useEffect(() => {
		if (val) setTouched(true);
	}, [val]);

	return (
		<FormField
			control={form?.control}
			name={name}
			render={({ field }) => (
				<FormItem className='relative'>
					{
						(label) &&
						<FormLabel
							className={cn(
								'text-[#6A6A6A] text-xs bg-white px-2 relative left-4 transition-all duration-500 ease-in-out',
								touched ? 'top-4 z-[2]' : 'top-8 z-[-1] opacity-0'
							)}
						>
							{label}
						</FormLabel>
					}
					<FormControl>
						<div className='relative'>
							{icon && (
								<div className='flex items-center gap-4 absolute top-3 left-4'>
									{icon}
									<span className='bg-gray-5 w-[1px] h-[33px]' />
								</div>
							)}
							{!name.toLowerCase().includes('password') ? (
								<Input
									disabled={disabled}
									placeholder={placeholder}
									{...field}
									onChange={(e) => {
										if (numericOnly) {
											e.target.value = e.target.value.replace(/\D/g, '');
										}
										field.onChange(e);
									}}
									className={cn(
										`h-[56px] border border-[#868C9866] border-solid rounded-full relative bg-transparent
              text-base md:text-sm font-semibold placeholder:text-[#6A6A6A] placeholder:font-normal !text-primary-black
              focus-visible:ring-0
							${icon ? 'pl-16' : 'pl-4'}
              `,
										className
									)}
									onFocus={() => setTouched(true)}
									onBlur={() => (!form?.watch(name) ? setTouched(false) : null)}
								/>
							) : (
								<Input
									placeholder={placeholder}
									{...field}
									onChange={(e) => {
										if (numericOnly) {
											e.target.value = e.target.value.replace(/\D/g, '');
										}
										field.onChange(e);
									}}
									className='h-[56px] border border-[#868C9866] border-solid rounded-full relative bg-transparent
            text-base md:text-sm font-semibold placeholder:text-[#6A6A6A] placeholder:font-normal !text-primary-black
            focus-visible:ring-0 pl-16
            '
									onFocus={() => setTouched(true)}
									onBlur={() => (!form?.watch(name) ? setTouched(false) : null)}
									type={showPwd ? 'text' : 'password'}
								/>
							)}
							{name.toLowerCase().includes('password') && (
								<button
									type='button'
									className='absolute top-4 right-4'
									onClick={() => setShowPwd(!showPwd)}>
									{!showPwd ? (
										<EyeOff color='#424242' className='h-6' />
									) : (
										<Eye color='#424242' className='h-6' />
									)}
								</button>
							)}

							{rightIcon && (
								<span className='absolute top-5 right-4'>{rightIcon}</span>
							)}
						</div>
					</FormControl>
					<FormMessage className='!-mb-2 text-xs' />
				</FormItem>
			)}
		/>
	);
};

export default AppInput;

export const DefaultInput = <TFieldValues extends FieldValues>({
	name,
	label,
	icon,
	placeholder,
	className,
	rightIcon,
	value,
	onChange,
	numericOnly,
}: InputProps<TFieldValues>) => {
	const [touched, setTouched] = useState(false);
	const [showPwd, setShowPwd] = useState(false);

	return (
		<div className='relative'>
			<Label
				className={cn(
					'text-[#6A6A6A] text-xs bg-white px-2 relative left-4 transition-all duration-500 ease-in-out',
					touched ? 'top-4 z-[2]' : 'top-8 z-[-1] opacity-0'
				)}>
				{label}
			</Label>
			<div className='relative'>
				{icon && (
					<div className='flex items-center gap-4 absolute top-3 left-4'>
						{icon}
						<span className='bg-gray-5 w-[1px] h-[33px]' />
					</div>
				)}
				{!name.toLowerCase().includes('password') ? (
					<Input
						placeholder={placeholder}
						className={cn(
							`h-[56px] border border-[#868C9866] border-solid rounded-full relative bg-transparent
              text-base md:text-sm font-semibold placeholder:text-[#6A6A6A] placeholder:font-normal !text-primary-black
              focus-visible:ring-0
							${icon ? 'pl-16' : 'pl-4'}
              `,
							className
						)}
						onFocus={() => setTouched(true)}
						onBlur={() => (!value ? setTouched(false) : null)}
						onChange={(e) => {
							if (numericOnly) {
								e.target.value = e.target.value.replace(/\D/g, '');
							}
							onChange?.(e);
						}}
						value={value}
					/>
				) : (
					<Input
						placeholder={placeholder}
						className='h-[56px] border border-[#868C9866] border-solid rounded-full relative bg-transparent
            text-base md:text-sm font-semibold placeholder:text-[#6A6A6A] placeholder:font-normal !text-primary-black
            focus-visible:ring-0 pl-16
            '
						onFocus={() => setTouched(true)}
						onBlur={() => (!value ? setTouched(false) : null)}
						onChange={(e) => {
							if (numericOnly) {
								e.target.value = e.target.value.replace(/\D/g, '');
							}
							onChange?.(e);
						}}
						value={value}
						type={showPwd ? 'text' : 'password'}
					/>
				)}
				{name.toLowerCase().includes('password') && (
					<button
						type='button'
						className='absolute top-4 right-4'
						onClick={() => setShowPwd(!showPwd)}>
						{!showPwd ? (
							<EyeOff color='#424242' className='h-6' />
						) : (
							<Eye color='#424242' className='h-6' />
						)}
					</button>
				)}

				{rightIcon && <span className='absolute top-5 right-4'>{rightIcon}</span>}
			</div>
		</div>
	);
};