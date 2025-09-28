import {setRequestLocale} from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  // Enable static rendering - Chinese only
  setRequestLocale('zh');

  return children;
}

export function generateStaticParams() {
  return [{locale: 'zh'}]; // Chinese only
}