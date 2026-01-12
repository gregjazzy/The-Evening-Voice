/**
 * Layout pour les pages d'authentification
 * Pas de sidebar, juste le contenu centré
 */

interface AuthLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AuthLayout({
  children,
  params,
}: AuthLayoutProps) {
  await params // Attendre les params même si on ne les utilise pas

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aurora-950 to-gray-950">
      {children}
    </div>
  )
}
