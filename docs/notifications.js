// docs/notifications.js
const showToast = (message, type = 'info') => {
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = 'linear-gradient(to right, #00b09b, #96c93d)';
            break;
        case 'error':
            backgroundColor = 'linear-gradient(to right, #ff5f6d, #ffc371)';
            break;
        default:
            backgroundColor = 'linear-gradient(to right, #6a11cb, #2575fc)';
            break;
    }

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        backgroundColor: backgroundColor,
        stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
};

/**
 * NEW: Sanitizes a string to prevent XSS attacks by converting HTML special characters.
 * @param {string} str The string to sanitize.
 * @returns {string} The sanitized string.
 */
const sanitizeHTML = (str) => {
    if (str === null || str === undefined) {
        return '';
    }
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
};