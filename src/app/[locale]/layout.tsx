import {setRequestLocale} from 'next-intl/server';

export default function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Enable static rendering
  setRequestLocale(locale);

  return children;
}

export function generateStaticParams() {
  return [{locale: 'en'}, {locale: 'zh'}];
}