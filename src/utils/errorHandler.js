/**
 * Centralized error handling utility
 */

/**
 * Get user-friendly error message
 */
const getErrorMessage = (error) => {
    if (!error) return 'Une erreur est survenue. Veuillez réessayer.';
    
    if (typeof error === 'string') {
        return error;
    }

    if (error?.message) {
        const message = error.message.toLowerCase();
        
        // Network errors
        if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
            return 'Problème de connexion. Vérifiez votre connexion internet et réessayez.';
        }

        // Supabase specific errors
        if (error.code === 'PGRST116') {
            return 'La ressource demandée n\'existe pas.';
        }

        if (error.code === '23505') {
            return 'Cette entrée existe déjà dans la base de données.';
        }

        return error.message;
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
};

/**
 * Handle and format errors for user display
 */
export const handleError = (error, setErrorState = null) => {
    const errorMessage = getErrorMessage(error);

    // Set error state if provided
    if (setErrorState) {
        setErrorState(errorMessage);
    }

    // Log to console in development only
    if (import.meta.env.DEV) {
        console.error('Error:', error);
    }

    return errorMessage;
};

/**
 * Show error notification (can be extended to use toast library)
 */
export const showError = (error, notificationSetter = null) => {
    const message = handleError(error);
    
    if (notificationSetter) {
        notificationSetter({
            message,
            type: 'error'
        });
    }
    
    return message;
};

/**
 * Show success notification
 */
export const showSuccess = (message, notificationSetter = null) => {
    if (notificationSetter) {
        notificationSetter({
            message,
            type: 'success'
        });
    }
};

