import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for an active session on load
    const storedUser = localStorage.getItem('hospital_auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password, role) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('hospital_users') || '[]');
        const foundUser = users.find(u => u.email === email && u.password === password && u.role === role);

        if (foundUser) {
          const { password: _, ...sessionUser } = foundUser;
          setUser(sessionUser);
          localStorage.setItem('hospital_auth_user', JSON.stringify(sessionUser));
          resolve(sessionUser);
        } else {
          reject(new Error('Invalid credentials or role mismatch.'));
        }
      }, 500);
    });
  };

  const registerHospital = (hospitalName, adminName, adminEmail, adminPassword) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const hospitals = JSON.parse(localStorage.getItem('hospital_hospitals') || '[]');
        const users = JSON.parse(localStorage.getItem('hospital_users') || '[]');

        if (hospitals.find(h => h.name.toLowerCase() === hospitalName.toLowerCase())) {
          reject(new Error('A hospital with this name is already registered.'));
          return;
        }
        if (users.find(u => u.email === adminEmail)) {
          reject(new Error('Email already exists.'));
          return;
        }

        const newHospital = {
          id: 'HOSP-' + Date.now(),
          name: hospitalName,
          createdAt: new Date().toISOString()
        };

        const newAdminUser = {
          id: Date.now().toString(),
          name: adminName || `${hospitalName} Admin`,
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          hospitalId: newHospital.id,
          createdAt: new Date().toISOString()
        };

        hospitals.push(newHospital);
        users.push(newAdminUser);
        
        localStorage.setItem('hospital_hospitals', JSON.stringify(hospitals));
        localStorage.setItem('hospital_users', JSON.stringify(users));

        const { password: _, ...sessionUser } = newAdminUser;
        setUser(sessionUser);
        localStorage.setItem('hospital_auth_user', JSON.stringify(sessionUser));
        resolve(sessionUser);
      }, 500);
    });
  };

  const register = (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('hospital_users') || '[]');
        
        if (users.find(u => u.email === userData.email)) {
          reject(new Error('Email already exists.'));
          return;
        }

        const newUser = {
          ...userData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          // Independent doctor status if no hospitalId is passed initially
          hospitalId: userData.hospitalId || null,
        };

        users.push(newUser);
        localStorage.setItem('hospital_users', JSON.stringify(users));
        
        const { password: _, ...sessionUser } = newUser;
        setUser(sessionUser);
        localStorage.setItem('hospital_auth_user', JSON.stringify(sessionUser));
        resolve(sessionUser);
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hospital_auth_user');
  };

  const value = {
    user,
    loading,
    login,
    register,
    registerHospital,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
