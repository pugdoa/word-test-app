import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 問題用紙・解答用紙の英単語/熟語に使う。
// l(小文字L)/I(大文字i)/1 や O/0 を別形状にした判読性重視のフォント。
// next/font で同梱するため、Mac でも Windows でも同じ字形で印刷される。
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-word",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: '英単語テスト作成',
  description: '英単語テストを作成・印刷できるアプリです',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${atkinson.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
