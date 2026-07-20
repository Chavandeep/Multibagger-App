import { Routes, Route, useLocation } from 'react-router-dom'
import TapNav from './components/TapNav'
import Top50Page from './pages/Top50Page'
import MultibaggerPicksPage from './pages/MultibaggerPicksPage'
import WatchlistPage from './pages/WatchlistPage'
import SmartMoneyPage from './pages/SmartMoneyPage'
import MacroPage from './pages/MacroPage'
import AddStockPage from './pages/AddStockPage'
import CompanyDetailPage from './pages/CompanyDetailPage'

function App() {
  const { pathname } = useLocation()
  // The Top 50 grid needs to grow wide enough for its tiles to fill the
  // screen height without distorting their aspect ratio — the standard
  // reading-width cap used elsewhere would bottleneck tile size on width
  // long before height became the limiting factor. Every other page keeps
  // the narrower, more readable width.
  const isTop50 = pathname === '/'
  const widthClass = isTop50 ? 'max-w-md md:max-w-none' : 'max-w-md md:max-w-4xl lg:max-w-6xl'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <TapNav />
      <div className="md:pl-[var(--rail-w,5rem)] transition-[padding-left] duration-300 ease-in-out">
        <div className={`mx-auto ${widthClass} min-h-screen relative`}>
          <Routes>
            <Route path="/" element={<Top50Page />} />
            <Route path="/picks" element={<MultibaggerPicksPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/smart-money" element={<SmartMoneyPage />} />
            <Route path="/macro" element={<MacroPage />} />
            <Route path="/add" element={<AddStockPage />} />
            <Route path="/company/:symbol" element={<CompanyDetailPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
