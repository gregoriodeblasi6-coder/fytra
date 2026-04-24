import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitApp - Il tuo coach AI sociale",
  description: "Condividi pasti e allenamenti con gli amici, ricevi consigli personalizzati dall'AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={geist.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}