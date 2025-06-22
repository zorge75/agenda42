import axios from 'axios';
import React, { createContext, FC, ReactNode, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

export interface IAuthContextProps {
	user: string; // Username (e.g., 42 login)
	setUser: (user: string) => void;
	token: string | null; // Bearer token
}

// Create the context
const AuthContext = createContext<IAuthContextProps>({
	user: '',
	setUser: () => { },
	token: null,
});

interface IAuthContextProviderProps {
	children: ReactNode;
	initialToken?: string | null;
  me?: any;
}

export const AuthContextProvider: FC<IAuthContextProviderProps> = ({ children, initialToken, me }) => {
	// @ts-ignore
	const [user, setUser] = useState<string>(null);
	const [token, setToken] = useState<string | null>(initialToken || null);

	// Hydrate token and fetch user data on mount (client-side)
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server

    // Check localStorage for username
    // const storedUsername = localStorage.getItem('facit_authUsername') || '';
    // setUser(storedUsername);

  }, [token]);

  // Update localStorage when user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('facit_authUsername', user);
    }

  }, [user]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      token,
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialToken: PropTypes.string,
  me: PropTypes.any,
};

export default AuthContext;