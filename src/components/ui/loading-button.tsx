import { Loader2 } from 'lucide-react';
import { Button } from './button';

type ButtonProps = {
	loading: boolean;
	disabled?: boolean;
	className?: string;
	children: React.ReactNode;
	variant: 'primary' | 'secondary' | 'default' | 'resend' | 'destructive';
	type?: 'button' | 'submit' | 'reset' | undefined;
	onClick?: () => void;
};

const LoadingButton: React.FC<ButtonProps> = ({
	loading,
	disabled,
	className,
	children,
	variant,
	type,
	onClick,
}) => {
	return (
		<Button
			className={className}
			variant={variant}
			disabled={loading || disabled}
			type={type}
			onClick={onClick}>
			{loading ? <Loader2 className='animate-spin' /> : children}
		</Button>
	);
};

export default LoadingButton;
