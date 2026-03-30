import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SoundSpace',
  description: 'Layer ambient sounds, build the perfect acoustic environment, save presets, and stay on task with a built-in Pomodoro timer.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
