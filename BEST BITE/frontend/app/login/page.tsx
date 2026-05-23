'use client';

import { useState, type FormEvent } from 'react';

const ADMIN_EMAIL = 'admin@bitebest.com';
const ADMIN_PASSWORD = 'bitebest123';
const ADMIN_SESSION_KEY = 'bitebestAdmin';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      window.location.href = '/admin';
      return;
    }

    setError('Invalid admin email or password');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F3EA] px-6 text-[#1F2A1D]">
      <section className="w-full max-w-md rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] p-8 shadow-[0_20px_50px_rgba(85,107,47,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#556B2F]">Admin Login</p>
        <h1 className="mt-3 text-3xl font-semibold">BiteBest Admin</h1>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-[#6B6B5F]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              className="mt-2 w-full rounded-[18px] border border-[#DDD2BD] bg-[#F7F3EA] px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-[#6B6B5F]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              className="mt-2 w-full rounded-[18px] border border-[#DDD2BD] bg-[#F7F3EA] px-4 py-3 outline-none"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-[18px] bg-[#556B2F] px-5 py-3 text-sm font-semibold text-[#F7F3EA] transition hover:bg-[#4a5f24]"
          >
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
