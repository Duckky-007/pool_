import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api.js';
import { Building2, User, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, loginAsDemoUser } = useAuth();

  const isRegister = location.pathname === '/register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'investor' | 'company'>('investor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  useEffect(() => {
    api.getDemoUsers().then((res) => setDemoUsers(res.users)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
        navigate(role === 'company' ? '/company' : '/investor');
      } else {
        await login(email, password);
        navigate('/pools');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUser: any) => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemoUser(demoUser);
      navigate(demoUser.role === 'company' ? '/company' : '/investor');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 sm:p-8 shadow-sm transition-colors">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded bg-primary dark:bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
            P
          </div>
          <h2 className="text-2xl font-bold text-neutralDark dark:text-gray-100 tracking-tight">
            {isRegister ? 'Create your account' : 'Sign in to PoolFund'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isRegister
              ? 'Choose whether you are investing or funding an asset'
              : 'Enter your credentials to access your dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('investor')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition ${
                      role === 'investor'
                        ? 'border-primary bg-primary text-white dark:bg-emerald-600 dark:border-emerald-600'
                        : 'border-subtleBorder dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Investor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('company')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition ${
                      role === 'company'
                        ? 'border-primary bg-primary text-white dark:bg-emerald-600 dark:border-emerald-600'
                        : 'border-subtleBorder dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Company</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name / Legal Entity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={role === 'company' ? 'e.g. Metro Express Cabs Ltd.' : 'e.g. John Doe'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Default: password123</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary dark:bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-primary-600 dark:hover:bg-emerald-500 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Please wait...' : isRegister ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <Link to="/login" className="text-primary dark:text-emerald-400 font-semibold hover:underline">
                Sign In
              </Link>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <Link to="/register" className="text-primary dark:text-emerald-400 font-semibold hover:underline">
                Register now
              </Link>
            </span>
          )}
        </div>

        {/* 1-Click Demo Accounts Grid */}
        <div className="mt-8 pt-6 border-t border-subtleBorder dark:border-gray-800">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Fast 1-Click Demo Logins</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">No typing needed</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u)}
                className="w-full text-left p-2 rounded border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-emerald-500 hover:bg-primary-50/30 dark:hover:bg-emerald-950/30 flex items-center justify-between transition text-xs"
              >
                <div>
                  <span className="font-semibold text-neutralDark dark:text-gray-200">{u.name}</span>
                  <span className="text-gray-400 dark:text-gray-500 ml-1.5 text-[11px]">({u.email})</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-primary dark:text-emerald-400 bg-primary-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
