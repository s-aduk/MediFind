import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,   // ✅ Added
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';

// ✅ Configure Amplify only on the client side
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

// ---- AUTH FUNCTIONS ----

// Sign Up
export const signUp = async (email, password, name) => {
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
export const confirmSignUp = async (email, code) => {
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
export const signIn = async (email, password) => {
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

// Get ID token
export const getIdToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('idToken');
};

// Check if authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('idToken');
};