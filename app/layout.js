import './global.css';

export const metadata = {
  title: 'Cloud Note Pad',
  description: 'A beautiful Next.js monorepo note app backed by Neon Postgres',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#54b8b7', minHeight: '100vh', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}