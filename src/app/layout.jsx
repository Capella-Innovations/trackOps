import "./globals.css";
import { Inter } from "next/font/google";

export const metadata = {
  title: {
    default: "TrackOps",
    template: "%s — TrackOps",
  },
  description:
    "GovTech planning OS: WBS, calendar, Slack nudges. Metadata-only today; GCC High enclave tomorrow.",
};

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white text-slate-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}
