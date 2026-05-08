import "./globals.css";

export const metadata = {
  title: "Lederhof Scoring-Modell",
  description: "AHP-TOPSIS Hybrid-Modell zur Maßnahmenbewertung am Lederhof",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
