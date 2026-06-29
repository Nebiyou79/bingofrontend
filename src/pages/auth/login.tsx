/**
 * pages/auth/login.tsx
 * Login page — renders the LoginForm component.
 */

import type { NextPage } from 'next';
import Head from 'next/head';
import { LoginForm } from '../../components/auth/LoginForm';

const LoginPage: NextPage = () => (
  <>
    <Head>
      <title>Sign In — DashBets</title>
      <meta name="description" content="Sign in to your DashBets account" />
    </Head>
    <LoginForm />
  </>
);

export default LoginPage;
