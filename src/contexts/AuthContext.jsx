import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                fetchUserRole(session.user);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                setUser(session.user);
                await fetchUserRole(session.user);
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userIdOrUser) => {
        try {
            let role;
            let userId;

            // Handle flexible input (ID string or User object)
            if (typeof userIdOrUser === 'string') {
                userId = userIdOrUser;
                // Only fetch user if we don't have it locally or need fresh data
                const { data: { user } } = await supabase.auth.getUser();
                role = user?.user_metadata?.role;
            } else if (userIdOrUser?.id) {
                userId = userIdOrUser.id;
                role = userIdOrUser.user_metadata?.role;
            } else {
                throw new Error('Invalid user data provided to fetchUserRole');
            }

            // If no role in metadata, fetch from profiles
            if (!role) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .maybeSingle();

                if (profile) {
                    role = profile.role;
                }
            }

            setUserRole(role);
        } catch (error) {
            console.error('Error fetching user role:', error);
            setUserRole(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, userRole, loading, signOut, fetchUserRole }}>
            {children}
        </AuthContext.Provider>
    );
};

