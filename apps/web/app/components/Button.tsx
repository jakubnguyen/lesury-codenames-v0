import Link from 'next/link';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
}

const variantMap = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
} as const;

export default function Button({
    children,
    href,
    onClick,
    variant = 'primary',
    className = '',
}: ButtonProps) {
    const shadcnVariant = variantMap[variant];

    if (href) {
        return (
            <ShadcnButton
                variant={shadcnVariant}
                size="lg"
                className={cn('rounded-2xl px-8 py-4 text-lg font-bold h-auto', className)}
                asChild
            >
                <Link href={href}>{children}</Link>
            </ShadcnButton>
        );
    }

    return (
        <ShadcnButton
            variant={shadcnVariant}
            size="lg"
            className={cn('rounded-2xl px-8 py-4 text-lg font-bold h-auto', className)}
            onClick={onClick}
        >
            {children}
        </ShadcnButton>
    );
}
