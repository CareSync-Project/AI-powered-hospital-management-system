import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { setAccessToken, setAuthFailureHandler } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ user: null, profile: null, hospitalContext: [] });
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = () => {
    setAccessToken(null);
    setAuth({ user: null, profile: null, hospitalContext: [] });
  };

  const applyResponse = (payload) => {
    const data = payload?.data || payload;
    if (data.accessToken) setAccessToken(data.accessToken);
    const profile = data.profile || null;
    const hospitalContext = data.hospitalContext || [];
    const displayUser = {
      ...data.user,
      name: profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : data.user.email,
      hospitalId: hospitalContext[0]?.hospitalId || null,
    };
    setAuth({ user: displayUser, profile, hospitalContext });
    return displayUser;
  };

  useEffect(() => {
    setAuthFailureHandler(clearAuth);
    authService.refreshSession().then(applyResponse).catch(clearAuth).finally(() => setIsLoading(false));
    return () => setAuthFailureHandler(() => {});
  }, []);

  const login = async (email, password) => applyResponse(await authService.login({ email, password }));
  const register = (data) => authService.registerPatient(data);
  const refreshAuth = async () => applyResponse(await authService.refreshSession());
  const logout = async () => { try { await authService.logout(); } finally { clearAuth(); } };
  const logoutAll = async () => { try { await authService.logoutAll(); } finally { clearAuth(); } };
  const changePassword = async (data) => applyResponse(await authService.changePassword(data));

  const value = useMemo(() => ({
    ...auth,
    role: auth.user?.role || null,
    isAuthenticated: Boolean(auth.user),
    isLoading,
    loading: isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshAuth,
    changePassword,
  }), [auth, isLoading]);

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};
