import { cn } from '@/lib/utils';
import { Input } from './input';

type SeachProps = {
	value: string;
	placeholder: string;
	parentClass?: string;
	onChange: (e: string) => void;
};

const AppSearch: React.FC<SeachProps> = ({
	value,
	placeholder,
	parentClass,
	onChange,
}) => {
	return (
		<div
			className={cn(
				`flex items-center gap-[10px] h-12 
                    border border-solid border-[#868C9866] 
                    rounded-full bg-white px-3 max-w-[22rem] w-full`,
				parentClass
			)}>
			<svg
				width='24'
				height='25'
				viewBox='0 0 24 25'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'>
				<path
					d='M21 21.1153L16.65 16.7653M19 11.1152C19 15.5335 15.4183 19.1152 11 19.1152C6.58172 19.1152 3 15.5335 3 11.1152C3 6.69696 6.58172 3.11523 11 3.11523C15.4183 3.11523 19 6.69696 19 11.1152Z'
					stroke='#BDBDBD'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			</svg>
			<span className='h-[33px] bg-gray-5 w-[1px]' />
			<Input
				value={value}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
				className='text-primary-black placeholder:text-[#6A6A6A] text-sm border-none bg-none outline-none focus-visible:ring-0 shadow-none px-0'
			/>
		</div>
	);
};

export default AppSearch;
