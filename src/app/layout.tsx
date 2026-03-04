import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'Lesury - Board Games Reimagined',
    description: 'Turn any screen into a game night. Play board games together using your phones as controllers.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Google Analytics */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-ZGB4JDXTNY"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-ZGB4JDXTNY');
                    `}
                </Script>
            </head>
            <body className={`${inter.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
