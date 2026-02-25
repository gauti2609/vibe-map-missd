
/**
 * Global Error Handler for VibeMap
 * Provides standardized error codes and user-friendly messages.
 */

export const ERROR_CODES = {
    // Authentication Errors
    AUTH_NOT_LOGGED_IN: 'ERR_AUTH_01',
    AUTH_LOGIN_FAILED: 'ERR_AUTH_02',
    AUTH_LOGOUT_FAILED: 'ERR_AUTH_03',

    // Permission Errors
    PERM_DENIED: 'ERR_PERM_01',
    PERM_ACTION_NOT_ALLOWED: 'ERR_PERM_02', // e.g. deleting someone else's post

    // Data/Input Errors
    DATA_MISSING_FIELDS: 'ERR_DATA_01',
    DATA_INVALID_TYPE: 'ERR_DATA_02',
    DATA_UPLOAD_FAILED: 'ERR_DATA_03',

    // Network/Firestore Errors
    NET_CONNECTION: 'ERR_NET_01',
    NET_FIRESTORE_WRITE: 'ERR_NET_02',
    NET_FIRESTORE_READ: 'ERR_NET_03',
    NET_UNKNOWN: 'ERR_NET_99',
};

type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Handles errors by logging them to console and displaying a standardized alert to the user.
 * 
 * @param action - A short description of what the user was trying to do (e.g. "Create Post")
 * @param error - The error object caught in the try/catch block
 * @param code - The specific error code from ERROR_CODES to assign
 */
export const handleError = (action: string, error: any, code: string = ERROR_CODES.NET_UNKNOWN) => {
    console.error(`[${code}] ${action} Failed:`, error);

    // Check for common Firestore error patterns to override code if needed
    let finalCode = code;
    if (error?.code === 'permission-denied') finalCode = ERROR_CODES.PERM_DENIED;
    if (error?.code === 'unavailable') finalCode = ERROR_CODES.NET_CONNECTION;

    const userMessage = error?.message || "An unexpected error occurred.";

    // Replaced blocking alert with console warning per audit recommendation.
    // Ideally, connect to a Toast notification system here.
    console.warn(`Action Failed: ${action} [${finalCode}]: ${userMessage}`);
};
