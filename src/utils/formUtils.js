/**
 * Utility functions for form handling, validation, and sanitization
 */

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validate phone number (basic validation)
 */
export const validatePhone = (phone) => {
    if (!phone) return true; // Optional field
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 15;
};

/**
 * Prevent double submission by wrapping async functions
 */
export const preventDoubleSubmit = (asyncFn) => {
    let isSubmitting = false;
    return async (...args) => {
        if (isSubmitting) {
            return;
        }
        isSubmitting = true;
        try {
            const result = await asyncFn(...args);
            return result;
        } finally {
            // Reset after a short delay to prevent rapid clicks
            setTimeout(() => {
                isSubmitting = false;
            }, 500);
        }
    };
};

/**
 * Format error message for display
 */
export const formatError = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Une erreur est survenue. Veuillez réessayer.';
};

