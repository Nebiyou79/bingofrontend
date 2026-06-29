/**
 * pages/auth/register.tsx
 * Registration page — renders the RegisterForm component.
 */

import type { NextPage } from 'next';
import Head from 'next/head';
import { RegisterForm } from '../../components/auth/RegisterForm';

const RegisterPage: NextPage = () => (
  <>
    <Head>
      <title>Create Account — DashBets</title>
      <meta name="description" content="Create your DashBets account" />
    </Head>
    <RegisterForm />
  </>
);

export default RegisterPage;
