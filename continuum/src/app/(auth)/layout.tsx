/* Auth layout — minimal shell for unauthenticated pages (login). */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0a1929 0%, #0d2137 50%, #001529 100%)',
      }}
    >
      {children}
    </div>
  )
}
