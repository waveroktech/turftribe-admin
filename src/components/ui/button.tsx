import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          '!h-[48px] rounded-full bg-gray-2 text-[#6A6A6A] hover:bg-[#EFEFEF] transition-color duration-300 ease-in-out',
        destructive:
          '!h-[48px] bg-[#FEEDED] text-[#FF0000] rounded-full transition-color duration-300 ease-in-out hover:bg-[#FEE3E3]',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-black !h-[48px] rounded-full text-primary transition-color duration-300 ease-in-out hover:bg-[#1A1A1A]',
        ghost:
          'hover:bg-accent hover:text-accent-foreground transition-color duration-300 ease-in-out',
        tertiary:
          '!h-[48px] rounded-full text-primary-black bg-[#F8FFE4] hover:bg-[#EEF5D8]',
        resend:
          'text-[#0C0C0C] bg-[#F8FFE4] !h-[48px] rounded-full transition-color duration-300 ease-in-out hover:bg-[#EEF8D4]',
        primary:
          'bg-primary !h-[48px] rounded-full text-black transition-color duration-300 ease-in-out hover:bg-[#B8D962]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };