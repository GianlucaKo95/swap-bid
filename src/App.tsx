import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import NewListingPage from './pages/NewListingPage'
import ListingDetailPage from './pages/ListingDetailPage'
import MyListingsPage from './pages/MyListingsPage'
import MyOffersPage from './pages/MyOffersPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="gesuche/:id" element={<ListingDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registrieren" element={<RegisterPage />} />
        <Route
          path="neu"
          element={
            <RequireAuth>
              <NewListingPage />
            </RequireAuth>
          }
        />
        <Route
          path="meine-gesuche"
          element={
            <RequireAuth>
              <MyListingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="meine-angebote"
          element={
            <RequireAuth>
              <MyOffersPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<p>Seite nicht gefunden.</p>} />
      </Route>
    </Routes>
  )
}
