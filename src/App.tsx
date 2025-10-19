import { NavLink, Route, Routes } from 'react-router-dom';
import { EvaluationProvider } from '@/context/EvaluationContext';
import RecordPage from '@/pages/RecordPage';
import DashboardPage from '@/pages/DashboardPage';

const App = () => {
  return (
    <EvaluationProvider>
      <div className="app-container">
        <header className="app-header">
          <div>
            <h1 className="app-title">Skin Care Tracker</h1>
            <p className="app-subtitle">BMI18.5以下または浮腫のある患者のスキンケア実施状況を記録</p>
          </div>
          <nav className="app-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              記録
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              ダッシュボード
            </NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<RecordPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <small>ローカル保存のみ（Firebase連携は後日追加予定）</small>
        </footer>
      </div>
    </EvaluationProvider>
  );
};

export default App;
