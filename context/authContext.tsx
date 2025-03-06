import axios from 'axios';
import React, { createContext, FC, ReactNode, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getUserDataWithUsername, IUserProps } from '../common/data/userDummyData';

export interface IAuthContextProps {
	user: string; // Username (e.g., 42 login)
	setUser: (user: string) => void;
	userData: Partial<IUserProps>; // Dummy user data
	token: string | null; // Bearer token
}

// Create the context
const AuthContext = createContext<IAuthContextProps>({
	user: '',
	setUser: () => { },
	userData: {},
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
	const [userData, setUserData] = useState<Partial<IUserProps>>({});
	const [token, setToken] = useState<string | null>(initialToken || null);

	// Hydrate token and fetch user data on mount (client-side)
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server

    console.log("me", me);

    // Check localStorage for username
    // const storedUsername = localStorage.getItem('facit_authUsername') || '';
    // setUser(storedUsername);

  }, [token]);

  // Update localStorage when user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('facit_authUsername', user);
    }
    setUserData(user ? getUserDataWithUsername(user) : {});

  }, [user]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      userData,
      token,
    }),
    [user, userData, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialToken: PropTypes.string,
  me: PropTypes.any,
};

export default AuthContext;