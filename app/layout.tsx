import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import Navigation from '@/components/navigation';
import { I18nProvider } from '@/components/i18n-provider';
import { Providers } from './providers';
import { NavigationEvents } from '@/providers/navigation-events';

export const metadata: Metadata = {
  title: 'MediaVault',
  description: 'Your Personal Media Library',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </I18nProvider>
          <Toaster />
          <NavigationEvents />
        </ThemeProvider>
      </body>
    </html>
  );
}