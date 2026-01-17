/**
 * Network and error handling utilities
 */

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('timeout') ||
           message.includes('connection');
};

/**
 * Check if error is a timeout
 */
export const isTimeoutError = (error) => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return message.includes('timeout') || message.includes('timed out');
};

/**
 * Get user-friendly error message based on error type
 */
export const getErrorMessage = (error) => {
    if (!error) return 'Une erreur est survenue. Veuillez réessayer.';
    
    if (typeof error === 'string') {
        return error;
    }

    if (error?.message) {
        // Network errors
        if (isNetworkError(error)) {
            return 'Problème de connexion. Vérifiez votre connexion internet et réessayez.';
        }

        // Timeout errors
        if (isTimeoutError(error)) {
            return 'La requête a pris trop de temps. Veuillez réessayer.';
        }

        // Supabase specific errors
        if (error.code === 'PGRST116') {
            return 'La ressource demandée n\'existe pas.';
        }

        if (error.code === '23505') {
            return 'Cette entrée existe déjà dans la base de données.';
        }

        if (error.code === '23503') {
            return 'Cette opération n\'est pas autorisée.';
        }

        // Generic error message
        return error.message;
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // Don't retry on certain errors
            if (error?.code === 'PGRST116' || error?.code === '23505') {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

