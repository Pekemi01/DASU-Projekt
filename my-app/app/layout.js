import './globals.css'

export const metadata = {
  title: 'WIF Teamprojekt - DASU',
  description: 'Scoring WebApp für den Lederhof',
};
 
export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}