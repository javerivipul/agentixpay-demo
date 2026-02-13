import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agentix Demo — AI Commerce Live',
  description: 'See how AI agents buy products through the Agentic Commerce Protocol',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
