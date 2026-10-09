import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { Banner } from './components/Banner.js';
import { Navbar } from './components/Navbar.js';
import { LandingPage } from './pages/LandingPage.js';
import { AuthPage } from './pages/AuthPage.js';
import { InvestorDashboard } from './pages/InvestorDashboard.js';
import { CompanyDashboard } from './pages/CompanyDashboard.js';
import { PoolDetailPage } from './pages/PoolDetailPage.js';
import { PoolsExplorePage } from './pages/PoolsExplorePage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';

// Route guards
const ProtectedInvestorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'investor') return <Navigate to="/company" replace />;
  return <>{children}</>;
};

const ProtectedCompanyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'company') return <Navigate to="/investor" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950 font-sans text-neutralDark dark:text-gray-100 transition-colors">
            {/* Required Banner on Every Page */}
            <Banner />
            {/* Main Top Navbar */}
            <Navbar />

            {/* Body Content */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/pools" element={<PoolsExplorePage />} />
                <Route path="/pools/:id" element={<PoolDetailPage />} />
                <Route
                  path="/investor"
                  element={
                    <ProtectedInvestorRoute>
                      <InvestorDashboard />
                    </ProtectedInvestorRoute>
                  }
                />
                <Route
                  path="/company"
                  element={
                    <ProtectedCompanyRoute>
                      <CompanyDashboard />
                    </ProtectedCompanyRoute>
                  }
                />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Simple Clean Footer */}
            <footer className="border-t border-subtleBorder dark:border-gray-800 bg-white dark:bg-gray-900 py-6 mt-12 text-center text-xs text-gray-500 dark:text-gray-400 transition-colors">
              <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-neutralDark dark:text-gray-200">PoolFund</span>
                  <span>•</span>
                  <span>Proportional Share-Based Asset Crowdfunding Prototype</span>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  Connected to MongoDB • MongoDB Compass: <code>mongodb://127.0.0.1:27017/poolfund</code>
                </div>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
