import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import ReduxProvider from '@/redux/ReduxProvider';
import NavbarVisibility from '@/components/common/Navbar/NavbarVisibility';
import { Cairo } from "next/font/google";
import { Inter } from "next/font/google";
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${inter.variable} font-sans antialiased`}>
      <body className="font-sans antialiased">
        <ReduxProvider>
          <NextIntlClientProvider>
            <NavbarVisibility>
              {children}
            </NavbarVisibility>
          </NextIntlClientProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}