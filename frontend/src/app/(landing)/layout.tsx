/**
 * @project AncestorTree
 * @file src/app/(landing)/layout.tsx
 * @description Landing route group layout — no auth, no sidebar, clean public shell
 * @version 2.0.0
 * @updated 2026-03-09
 */

import Link from 'next/link';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Top nav with public page links */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/welcome" className="flex items-center gap-2">
              <span className="text-xl">🌳</span>
              <span className="font-semibold text-gray-900">AncestorTree</span>
            </Link>
            <span className="hidden sm:inline text-xs text-gray-400 ml-1">Gia Phả Điện Tử</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/council" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Hội đồng
            </Link>
            <Link href="/ancestral-hall" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Nhà thờ
            </Link>
            <Link href="/register-member" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Ghi danh
            </Link>
            <a
              href="https://github.com/Minh-Tam-Solution/AncestorTree"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Page content with nav offset */}
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
