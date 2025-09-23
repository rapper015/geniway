import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ProfileCollectionProvider } from "../contexts/ProfileCollectionContext";
import GoogleAnalytics from "../components/GoogleAnalytics";
import { initializeGTM } from "../lib/gtm";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GeniWay - AI-Powered Learning Platform",
  description: "Ask your doubts in English, Hindi, or Hinglish. Get instant, step-by-step solutions with our AI-powered learning platform. Free during beta!",
  keywords: "AI learning, doubt solving, education, Hindi, English, Hinglish, students, homework help",
  authors: [{ name: "GeniWay Team" }],
  openGraph: {
    title: "GeniWay - AI-Powered Learning Platform",
    description: "Ask your doubts in English, Hindi, or Hinglish. Get instant, step-by-step solutions.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <LanguageProvider>
            <ProfileCollectionProvider>
              {children}
            </ProfileCollectionProvider>
          </LanguageProvider>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize GTM after page load
              if (typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  console.log('Page loaded, initializing GTM...');
                  // Call initializeGTM from the imported function
                  if (window.initializeGTM) {
                    window.initializeGTM();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}