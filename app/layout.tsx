import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { notoSansJp, spaceGrotesk } from './fonts';

export const metadata: Metadata = {
  title: '禁欲カレンダー',
  description: '禁欲の継続と達成状況を可視化するダッシュボード'
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
