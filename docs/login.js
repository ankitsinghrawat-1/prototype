document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    // Add a check to confirm the form element is found.
    if (!loginForm) {
        console.error("Error: The login form element with ID 'login-form' was not found.");
        return; 
    }

    if (!messageDiv) {
        console.error("Error: The message element with ID 'message' was not found.");    
    }

    // Check if the user is already logged in
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    if (loggedInUserEmail) {
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Log the data being sent to the server for debugging.
        console.log('Attempting to log in with:', { email, password });
        
        // Add visual feedback to the user while the request is in progress.
        if (messageDiv) {
            messageDiv.textContent = 'Logging in...';
            messageDiv.className = 'form-message info';
        }

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            // Log the server response to help with debugging.
            console.log('Server response:', data);

            if (response.ok) {
                sessionStorage.setItem('loggedInUserEmail', data.email);
                sessionStorage.setItem('userRole', data.role);
                
                if (messageDiv) {
                    messageDiv.textContent = 'Login successful!';
                    messageDiv.className = 'form-message success';
                }
                
                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                if (messageDiv) {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'form-message error';
                }
            }
        } catch (error) {
            if (messageDiv) {
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.className = 'form-message error';
            }
            console.error('Login error:', error);
        }
    });
});