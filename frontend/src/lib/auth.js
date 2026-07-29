import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  forgotPassword as amplifyForgotPassword,
  confirmForgotPassword as amplifyConfirmForgotPassword,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';

// Configure Amplify only on the client side
let configured = false;

const configureAmplify = () => {
  if (typeof window === 'undefined' || configured) return;

  import('aws-amplify').then(({ Amplify }) => {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
          userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
          region: process.env.NEXT_PUBLIC_COGNITO_REGION,
        },
      },
    });
    configured = true;
  });
};

// Call on client
if (typeof window !== 'undefined') {
  configureAmplify();
}

// Cookie helpers for SSR auth detection
const setAuthCookie = (token: string) => {
  if (typeof window === 'undefined') return;
  // Set cookie that middleware can read (expires in 1 hour)
  document.cookie = `medifind_auth=${encodeURIComponent(token)}; path=/; max-age=3600; SameSite=Lax`;
};

const clearAuthCookie = () => {
  if (typeof window === 'undefined') return;
  document.cookie = 'medifind_auth=; path=/; max-age=0; SameSite=Lax';
};

// ---- AUTH FUNCTIONS ----

// Sign Up
export const signUp = async (email: string, password: string, name: string) => {
  if (typeof window === 'undefined') throw new Error('Sign up only available on client');
  configureAmplify();
  try {
    const result = await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
    return result;
  } catch (error) {
    throw new Error(error.message || 'Sign up failed');
  }
};

// Confirm Sign Up (email verification)
export const confirmSignUp = async (email: string, code: string) => {
  if (typeof window === 'undefined') throw new Error('Confirm sign up only available on client');
  configureAmplify();
  try {
    const result = await amplifyConfirmSignUp({
      username: email,
      confirmationCode: code,
    });
    return result;
  } catch (error) {
    throw new Error(error.message || 'Confirmation failed');
  }
};

// Sign In
export const signIn = async (email: string, password: string) => {
  if (typeof window === 'undefined') throw new Error('Sign in only available on client');
  configureAmplify();
  try {
    const result = await amplifySignIn({
      username: email,
      password,
    });

    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) {
      localStorage.setItem('idToken', idToken);
      setAuthCookie(idToken);
    }
    const user = await getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));

    return result;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

// Sign Out
export const signOut = async () => {
  if (typeof window === 'undefined') return;
  configureAmplify();
  try {
    await amplifySignOut();
  } catch (error) {
    console.error('Sign out error:', error);
  } finally {
    localStorage.removeItem('idToken');
    localStorage.removeItem('user');
    clearAuthCookie();
  }
};

// Get current user
export const getCurrentUserInfo = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const user = await getCurrentUser();
    return user;
  } catch {
    return null;
  }
};

// Get valid ID token (refreshes if needed)
export const getValidIdToken = async () => {
  if (typeof window === 'undefined') return null;
  configureAmplify();
  try {
    const session = await fetchAuthSession({ forceRefresh: false });
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) {
      localStorage.setItem('idToken', idToken);
      setAuthCookie(idToken);
    }
    return idToken;
  } catch (error) {
    console.error('Failed to get valid token:', error);
    // Fall back to stored token
    const stored = localStorage.getItem('idToken');
    if (stored) setAuthCookie(stored);
    return stored;
  }
};

// Forgot Password
export const forgotPassword = async (email: string) => {
  if (typeof window === 'undefined') throw new Error('Forgot password only available on client');
  configureAmplify();
  try {
    const result = await amplifyForgotPassword({ username: email });
    return result;
  } catch (error) {
    throw new Error(error.message || 'Failed to send reset code');
  }
};

// Confirm Forgot Password
export const confirmForgotPassword = async (email: string, code: string, newPassword: string) => {
  if (typeof window === 'undefined') throw new Error('Confirm forgot password only available on client');
  configureAmplify();
  try {
    const result = await amplifyConfirmForgotPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
    return result;
  } catch (error) {
    throw new Error(error.message || 'Failed to reset password');
  }
};

// Get ID token (synchronous, may be expired)
export const getIdToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('idToken');
};

// Check if authenticated (synchronous, may be expired)
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('idToken');
};