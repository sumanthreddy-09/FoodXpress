import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Send, KeyRound, Loader2, ArrowLeft, ShieldAlert, Settings } from 'lucide-react';

export function LoginModal() {
  const { isOpen, setOpen, login } = useAuth();
  const [authType, setAuthType] = useState<'login' | 'signup' | 'forgot'>('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Reset states on modal close
  useEffect(() => {
    if (!isOpen) {
      setAuthType('signup');
      setFirstName('');
      setLastName('');
      setContact('');
      setPassword('');
      setNewPassword('');
      setError('');
      setLoading(false);
      setShowToast(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateContact = (val: string) => {
    if (!val.trim()) {
      return 'Email or Mobile Number is required';
    }
    // Simple Email Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // 10-digit mobile number regex
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!emailRegex.test(val) && !phoneRegex.test(val)) {
      return 'Please enter a valid Email ID or 10-digit Mobile Number';
    }
    return '';
  };

  const handleSignUp = () => {
    if (!firstName.trim()) {
      setError('First Name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Second Name is required');
      return;
    }
    const err = validateContact(contact);
    if (err) {
      setError(err);
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      try {
        const usersStr = localStorage.getItem('foodxpress_users_list');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const exists = users.some((u: any) => u.contact === contact);

        if (exists) {
          setError('An account with this email/mobile number already exists. Please log in.');
          setLoading(false);
          return;
        }

        // Save new user profile
        users.push({ contact, firstName, lastName, password });
        localStorage.setItem('foodxpress_users_list', JSON.stringify(users));

        login(contact, firstName, lastName);
        setOpen(false);
      } catch {
        setError('Database write failed.');
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const handleDirectLogin = () => {
    const err = validateContact(contact);
    if (err) {
      setError(err);
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      try {
        const usersStr = localStorage.getItem('foodxpress_users_list');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const matched = users.find((u: any) => u.contact === contact);

        if (!matched) {
          setError('No account found with this email/mobile number. Please sign up.');
          setLoading(false);
          return;
        }

        if (matched.password !== password) {
          setError('Incorrect password. Please check and try again.');
          setLoading(false);
          return;
        }

        // Correct credentials -> Log in!
        login(matched.contact, matched.firstName, matched.lastName);
        setOpen(false);
      } catch (e) {
        setError('Error accessing accounts database.');
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const handleResetPassword = () => {
    const err = validateContact(contact);
    if (err) {
      setError(err);
      return;
    }
    if (!newPassword.trim()) {
      setError('New Password is required');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      try {
        const usersStr = localStorage.getItem('foodxpress_users_list');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const matchedIndex = users.findIndex((u: any) => u.contact === contact);

        if (matchedIndex === -1) {
          setError('No account found with this email/mobile number.');
          setLoading(false);
          return;
        }

        // Update password
        users[matchedIndex].password = newPassword;
        localStorage.setItem('foodxpress_users_list', JSON.stringify(users));

        // Log in immediately
        const matched = users[matchedIndex];
        login(matched.contact, matched.firstName, matched.lastName);
        setOpen(false);
      } catch (e) {
        setError('Database update failed.');
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-fade-in">
      
      {/* Toast simulated OTP notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-xl animate-bounce-in">
          <span>{toastMsg}</span>
          <button onClick={() => setShowToast(false)} className="rounded-full bg-white/20 p-0.5 hover:bg-white/30">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <div className="flex justify-center text-orange-500">
            <Send className="h-10 w-10 animate-float" />
          </div>
          
          {authType === 'forgot' ? (
            <div>
              <h2 className="mt-3 text-center text-xl font-bold text-slate-800">Reset Password</h2>
              <p className="mt-1 text-center text-xs text-slate-400">
                Enter your registered email/phone and a new password to reset
              </p>

              <div className="mt-6 space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number / Email ID</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Enter registered mobile or email"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                  />
                  {error && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-red-500 animate-bounce-in">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password & Log In
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType('login');
                      setError('');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors underline"
                  >
                    Back to Log In
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="mt-3 text-center text-xl font-bold text-slate-800">
                {authType === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="mt-1 text-center text-xs text-slate-400">
                {authType === 'signup' ? 'Sign up to order delicious food items' : 'Sign in to access your orders'}
              </p>

              {/* Switcher */}
              <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('signup');
                    setError('');
                  }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    authType === 'signup' ? 'bg-white shadow text-orange-500' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('login');
                    setError('');
                  }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    authType === 'login' ? 'bg-white shadow text-orange-500' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Log In
                </button>
              </div>

              <div className="mt-5 space-y-3.5 text-left">
                {authType === 'signup' && (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. John"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Second Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Doe"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number / Email ID</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={authType === 'signup' ? 'Email or 10-digit Phone' : 'Enter mobile or email'}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    {authType === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthType('forgot');
                          setError('');
                        }}
                        className="text-[10px] font-bold text-orange-500 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (authType === 'login') handleDirectLogin();
                        else handleSignUp();
                      }
                    }}
                  />
                  {error && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-red-500 animate-bounce-in">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {error}
                    </p>
                  )}
                </div>

                {authType === 'login' ? (
                  <button
                    onClick={handleDirectLogin}
                    disabled={loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Logging In...
                      </>
                    ) : (
                      <>
                        Log In
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Sign Up & Log In
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
