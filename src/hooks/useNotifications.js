import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personnalisé pour gérer les notifications en temps réel
 * @param {boolean} enabled - Activer/désactiver la récupération des notifications
 * @returns {Object} { notifications, loading, unreadCount, markAsRead, markAllAsRead, refresh }
 */
export const useNotifications = (enabled = true) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user || !enabled) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const { data, error } = await supabase.rpc('mark_notification_read', {
                p_notification_id: notificationId
            });

            if (error) throw error;

            if (data?.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, read: true } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            return data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const { data, error } = await supabase.rpc('mark_all_notifications_read');

            if (error) throw error;

            if (data?.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n => ({ ...n, read: true }))
                );
                setUnreadCount(0);
            }

            return data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return { success: false, error: error.message };
        }
    };

    // Subscribe to real-time updates
    useEffect(() => {
        if (!user || !enabled) return;

        // Initial fetch
        fetchNotifications();

        // Subscribe to changes
        const subscription = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Notification change received:', payload);

                    if (payload.eventType === 'INSERT') {
                        // New notification
                        setNotifications(prev => [payload.new, ...prev]);
                        if (!payload.new.read) {
                            setUnreadCount(prev => prev + 1);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        // Updated notification
                        setNotifications(prev =>
                            prev.map(n =>
                                n.id === payload.new.id ? payload.new : n
                            )
                        );
                        // Recalculate unread count
                        setUnreadCount(
                            notifications.filter(n => !n.read).length
                        );
                    } else if (payload.eventType === 'DELETE') {
                        // Deleted notification
                        setNotifications(prev =>
                            prev.filter(n => n.id !== payload.old.id)
                        );
                        if (!payload.old.read) {
                            setUnreadCount(prev => Math.max(0, prev - 1));
                        }
                    }
                }
            )
            .subscribe();

        // Cleanup
        return () => {
            subscription.unsubscribe();
        };
    }, [user, enabled]);

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
};
