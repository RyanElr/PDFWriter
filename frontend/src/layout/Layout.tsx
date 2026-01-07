import { Link, useLocation } from 'react-router-dom'

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-slate-50 font-sans">
<header className="fixed inset-x-0 top-0 z-[9999] pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent border-b border-white/5">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-red-600 text-xs font-bold tracking-widest">
              PW
            </div>
            <span className="text-lg font-semibold tracking-tight">PDFWRITER</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <Link
              to="/"
              className={
                location.pathname === '/'
                  ? 'font-semibold text-white'
                  : 'text-slate-300 hover:text-white transition-colors'
              }
            >
              Accueil
            </Link>
            <Link
              to="/edit"
              className={
                location.pathname.startsWith('/edit')
                  ? 'font-semibold text-white'
                  : 'text-slate-300 hover:text-white transition-colors'
              }
            >
              Modifier un PDF
            </Link>
          </nav>
        </div>
      </header>
      <main className="pt-20 pb-10">{children}</main>
    </div>
  )
}

export default Layout
