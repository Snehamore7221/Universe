
import './auth.css';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      setMessage('Login successful! Your account is authenticated.');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <section className="auth-brand-panel">
          <div className="auth-brand">
            <div className="auth-logo">
              <GraduationCap size={27} />
            </div>
            <span>UniVerse</span>
          </div>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">YOUR CAMPUS. CONNECTED.</span>
            <h1>
              Your journey.
              <br />
              Your community.
              <br />
              <span>Your UniVerse.</span>
            </h1>
            <p>
              One intelligent campus ecosystem to learn, connect,
              grow, and make your college experience count.
            </p>
          </div>

          <div className="auth-brand-footer">
            <ShieldCheck size={17} />
            <span>Built for students. Designed for growth.</span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-mobile-logo">
              <GraduationCap size={25} />
              <span>UniVerse</span>
            </div>

            <div className="auth-heading">
              <span className="auth-welcome">WELCOME BACK</span>
              <h2>Sign in to your account</h2>
              <p>Enter your college email to continue.</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email">College email</label>
                <div className="auth-input-wrap">
                  <Mail size={18} />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="password">Password</label>
                  <button
                    type="button"
                    className="auth-text-button"
                    onClick={() =>
                      setError('Password recovery will be available soon.')
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="auth-input-wrap">
                  <Lock size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}
              {message && <div className="auth-success">{message}</div>}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="auth-divider">
              <span>NEW TO UNIVERSE?</span>
            </div>

            <p className="auth-register-text">
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </p>

            <p className="auth-privacy-note">
              Your student account is protected with secure authentication.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
