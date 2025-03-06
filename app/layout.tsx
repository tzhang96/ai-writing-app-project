import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ProjectsProvider } from '@/lib/project-context';
import { FirebaseProvider } from '@/lib/firebase-context';
import { Toaster } from '@/components/ui/toaster';
import { ChatProvider } from '@/lib/chat-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Writing App',
  description: 'An AI-powered writing assistant for authors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseProvider>
            <ChatProvider>
              <ProjectsProvider>
                {children}
                <Toaster />
              </ProjectsProvider>
            </ChatProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}