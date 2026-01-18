import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('🚀 [AuthContext] Initial auth check');

        // ⏱️ TIMEOUT SAFETY: Prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            if (loading) {
                console.error('⏰ [AuthContext] TIMEOUT! Loading took more than 5 seconds');
                console.error('📋 [AuthContext] Current state:', { user, userRole, loading });
                setLoading(false);

                // Si l'utilisateur est connecté mais pas de rôle, rediriger vers pending
                if (user && !userRole) {
                    console.warn('⚠️ [AuthContext] User authenticated but no role - might be pending approval');
                }
            }
        }, 5000); // 5 secondes maximum

        const initializeAuth = async () => {
            try {
                console.log('🔐 [AuthContext] Getting initial session...');
                const { data: { session } } = await supabase.auth.getSession();
                console.log('📦 [AuthContext] Session:', session ? 'exists' : 'null');

                if (session?.user) {
                    console.log('👤 [AuthContext] User found:', session.user.id);
                    setUser(session.user);
                    await fetchUserRole(session.user);
                } else {
                    console.log('👻 [AuthContext] No session found');
                    setLoading(false);
                }
            } catch (error) {
                console.error('💥 [AuthContext] Error in initializeAuth:', error);
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 [AuthContext] Auth state changed:', event);
            console.log('👤 [AuthContext] New session:', session ? 'exists' : 'null');

            if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ [AuthContext] User signed in:', session.user.id);
                setUser(session.user);
                setLoading(true); // Reset loading before fetching role
                await fetchUserRole(session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log('👋 [AuthContext] User signed out');
                setUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });

        // Cleanup
        return () => {
            console.log('🧹 [AuthContext] Cleaning up');
            clearTimeout(loadingTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserRole = async (userIdOrUser) => {
        console.log('🔍 [AuthContext] fetchUserRole called with:', typeof userIdOrUser);

        try {
            let role;
            let userId;

            // Handle flexible input (ID string or User object)
            if (typeof userIdOrUser === 'string') {
                userId = userIdOrUser;
                // Only fetch user if we don't have it locally or need fresh data
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) {
                    console.error('❌ [AuthContext] Error fetching user:', userError);
                    throw new Error('Impossible de récupérer les informations utilisateur');
                }
                role = user?.user_metadata?.role;
                console.log('📝 [AuthContext] Role from metadata:', role);
            } else if (userIdOrUser?.id) {
                userId = userIdOrUser.id;
                role = userIdOrUser.user_metadata?.role;
                console.log('📝 [AuthContext] Role from user object:', role);
            } else {
                throw new Error('Invalid user data provided to fetchUserRole');
            }

            // If no role in metadata, fetch from profiles (SOURCE OF TRUTH)
            if (!role) {
                console.log('🔎 [AuthContext] No role in metadata, fetching from profiles...');

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .maybeSingle();

                if (profileError) {
                    console.error('❌ [AuthContext] Error fetching profile:', profileError);
                    // Don't throw - user might not have profile yet
                } else {
                    console.log('📊 [AuthContext] Profile data:', profile);
                }

                if (profile) {
                    role = profile.role;
                    console.log('✅ [AuthContext] Role from profile:', role);
                } else {
                    // No profile found - user might be pending approval
                    console.warn('⚠️ [AuthContext] No profile found for user:', userId);
                    role = null;
                }
            }

            // Validate role is one of the expected values
            const validRoles = ['superadmin', 'owner', 'staff'];
            if (role && !validRoles.includes(role)) {
                console.error('❌ [AuthContext] Invalid role detected:', role);
                role = null; // Invalid role, treat as no role
            }

            console.log('🎯 [AuthContext] Final role:', role);
            setUserRole(role);
        } catch (error) {
            console.error('💥 [AuthContext] Critical error in fetchUserRole:', error);
            setUserRole(null);
            // Don't set user to null - they're still authenticated, just no role yet
        } finally {
            console.log('✓ [AuthContext] Setting loading to false');
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
