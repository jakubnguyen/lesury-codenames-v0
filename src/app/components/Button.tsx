import Link from 'next/link';

interface ButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
}

export default function Button({
    children,
    href,
    onClick,
    variant = 'primary',
    className = '',
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 active:scale-[0.98]';

    const variantStyles = {
        primary: 'bg-[#141413] text-[#FAF9F5] shadow-lg hover:shadow-xl hover:bg-opacity-90',
        secondary: 'bg-[#F0EFEA] text-[#141413] border-2 border-[#E8E6DC] hover:border-[#141413] shadow-md hover:shadow-lg',
        outline: 'border-2 border-[#141413] text-[#141413] hover:bg-[#F0EFEA] shadow-md hover:shadow-lg',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedClassName}>
                {children}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={combinedClassName}>
            {children}
        </button>
    );
}
