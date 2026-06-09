import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import PracticePage from './pages/PracticePage';
import ReviewPage from './pages/ReviewPage';
import TrendPage from './pages/TrendPage';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="回到首页">
          口语训练
        </NavLink>
        <nav className="main-nav" aria-label="主导航">
          <NavLink to="/practice">练习</NavLink>
          <NavLink to="/review">复盘</NavLink>
          <NavLink to="/trends">趋势</NavLink>
        </nav>
      </header>

      <main className="page-frame">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/trends" element={<TrendPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
