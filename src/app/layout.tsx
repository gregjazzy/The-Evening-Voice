import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'La Voix du Soir ✨',
  description: 'Un espace magique pour écrire, créer et rêver',
}

/**
 * Root Layout - Structure HTML de base
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Google Fonts pour typographies luxe */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Nunito:wght@300;400;500;600;700&family=Parisienne&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Quicksand:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Meta pour SEO multilingue */}
        <link rel="alternate" hrefLang="fr" href="https://lavoixdusoir.app/fr" />
        <link rel="alternate" hrefLang="en" href="https://lavoixdusoir.app/en" />
        <link rel="alternate" hrefLang="ru" href="https://lavoixdusoir.app/ru" />
        <link rel="alternate" hrefLang="x-default" href="https://lavoixdusoir.app" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* Suppress Supabase auth-js AbortError before Next.js dev overlay catches it */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('error', function(e) {
            var err = e.error || e.message || '';
            var s = err.toString ? err.toString() : String(err);
            if (s.indexOf('AbortError') !== -1 || s.indexOf('signal is aborted') !== -1 || (err && err.name === 'AbortError')) {
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            }
          }, true);
          window.addEventListener('unhandledrejection', function(e) {
            var err = e.reason || '';
            var s = err.toString ? err.toString() : String(err);
            if (s.indexOf('AbortError') !== -1 || s.indexOf('signal is aborted') !== -1 || (err && err.name === 'AbortError')) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          }, true);
        `}} />
        {children}
      </body>
    </html>
  )
}
