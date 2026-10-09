import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { api } from '../api.js';
import {
  Wallet,
  Building2,
  TrendingUp,
  History,
  LogOut,
  RefreshCw,
  PlusCircle,
  Users,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, refreshUser, loginAsDemoUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    api.getDemoUsers().then((res) => setDemoUsers(res.users)).catch(() => {});
  }, [user]);

  const handleTopup = async () => {
    if (!user) return;
    setTopupLoading(true);
    try {
      await api.claimFaucet(5000);
      await refreshUser();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTopupLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database with standard demo seed data (2 companies, 5 investors, 2 pools)?')) {
      return;
    }
    setResetLoading(true);
    try {
      await api.seedDatabase();
      await refreshUser();
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSwitchUser = async (demoUser: any) => {
    setShowSwitchMenu(false);
    try {
      await loginAsDemoUser(demoUser);
      navigate(demoUser.role === 'company' ? '/company' : '/investor');
    } catch (err: any) {
      alert('Could not switch user: ' + err.message);
    }
  };

  return (
    <nav className="border-b border-subtleBorder dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and primary links */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-lg tracking-tight">
              P
            </div>
            <span className="font-bold text-lg text-neutralDark dark:text-gray-100 tracking-tight">
              PoolFund
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/pools"
              className="text-gray-600 dark:text-gray-300 hover:text-neutralDark dark:hover:text-white transition-colors"
            >
              Explore Pools
            </Link>

            {user?.role === 'investor' && (
              <Link
                to="/investor"
                className="text-gray-600 dark:text-gray-300 hover:text-neutralDark dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4 text-primary dark:text-emerald-400" />
                Investor Portal
              </Link>
            )}

            {user?.role === 'company' && (
              <Link
                to="/company"
                className="text-gray-600 dark:text-gray-300 hover:text-neutralDark dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4 text-primary dark:text-emerald-400" />
                Company Dashboard
              </Link>
            )}

            {user && (
              <Link
                to="/transactions"
                className="text-gray-600 dark:text-gray-300 hover:text-neutralDark dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <History className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Ledger
              </Link>
            )}
          </div>
        </div>

        {/* User profile, theme toggle & actions */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-neutralDark dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {user ? (
            <>
              {/* Wallet balance & topup */}
              <div className="hidden sm:flex items-center bg-gray-50 dark:bg-gray-800/80 border border-subtleBorder dark:border-gray-700 rounded-md px-3 py-1.5 text-xs">
                <Wallet className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mr-1.5" />
                <span className="text-gray-500 dark:text-gray-400 mr-1.5">Wallet:</span>
                <span className="font-semibold tabular-numbers text-neutralDark dark:text-gray-100 text-sm">
                  ₹{user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <button
                  onClick={handleTopup}
                  disabled={topupLoading}
                  title="Add ₹5,000 demo funds"
                  className="ml-2.5 text-primary dark:text-emerald-400 hover:text-primary-600 dark:hover:text-emerald-300 flex items-center gap-0.5 font-medium transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Top-up</span>
                </button>
              </div>

              {/* Quick Demo Persona Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs border border-subtleBorder dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
                  title="Switch between demo accounts"
                >
                  <Users className="w-3.5 h-3.5 text-primary dark:text-emerald-400" />
                  <span className="font-medium hidden md:inline">Switch Role</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {showSwitchMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-subtleBorder dark:border-gray-700 rounded-md shadow-lg py-2 z-50 text-xs">
                    <div className="px-3 py-1 text-gray-400 dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                      Switch Demo Persona
                    </div>
                    {demoUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/60 transition ${
                          u.id === user.id ? 'bg-primary-50 dark:bg-emerald-950/40 font-semibold' : ''
                        }`}
                      >
                        <div>
                          <div className="text-neutralDark dark:text-gray-100">{u.name}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">
                            {u.role} • ₹{u.wallet_balance.toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                            u.role === 'company'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                          }`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}

                    <div className="border-t border-subtleBorder dark:border-gray-700 mt-1 pt-1 px-3">
                      <button
                        onClick={handleResetData}
                        disabled={resetLoading}
                        className="w-full py-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${resetLoading ? 'animate-spin' : ''}`} />
                        <span>Reset Seed Data</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User badge and logout */}
              <div className="flex items-center pl-2 space-x-2 border-l border-subtleBorder dark:border-gray-800">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-medium text-neutralDark dark:text-gray-200 leading-tight">{user.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-neutralDark dark:hover:text-white px-3 py-1.5 rounded transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium bg-primary text-white hover:bg-primary-600 px-3.5 py-1.5 rounded transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
