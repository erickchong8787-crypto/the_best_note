import './global.css';

export const metadata = {
  title: 'Stillnote — a little space for your mind',
  description: 'A calm, private space to collect your thoughts and ideas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}