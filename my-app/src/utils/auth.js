// src/utils/auth.js
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return token !== null;
};
