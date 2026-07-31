import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-brand-50'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-brand-700">
            SwapBid
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={linkClass}>
              Gesuche
            </NavLink>
            {user && (
              <>
                <NavLink to="/neu" className={linkClass}>
                  Geld anbieten
                </NavLink>
                <NavLink to="/meine-gesuche" className={linkClass}>
                  Meine Gesuche
                </NavLink>
                <NavLink to="/meine-angebote" className={linkClass}>
                  Meine Angebote
                </NavLink>
              </>
            )}
            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l">
                <span className="text-sm text-gray-500">{profile?.display_name ?? user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Abmelden
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l">
                <NavLink to="/login" className={linkClass}>
                  Anmelden
                </NavLink>
                <NavLink
                  to="/registrieren"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700"
                >
                  Registrieren
                </NavLink>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-gray-400">
        SwapBid – der umgekehrte Kleinanzeigenmarkt: Geld posten, Objekte dafür bieten.
        <br />
        <Link to="/nutzungsbedingungen" className="hover:underline">
          Nutzungsbedingungen
        </Link>
      </footer>
    </div>
  )
}
