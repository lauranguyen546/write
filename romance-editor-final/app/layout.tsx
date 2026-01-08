import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Romance Editor - AI-Powered Manuscript Analysis',
  description: 'Professional editorial feedback for romance novels',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-romance-600">
                  Romance Editor
                </h1>
              </div>
              <div className="flex space-x-4">
                <a href="/" className="text-gray-700 hover:text-romance-600">
                  Projects
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
            <p>Romance Editor - AI-powered manuscript analysis for authors</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
