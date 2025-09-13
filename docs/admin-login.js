document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('admin-login-form');
    const messageDiv = document.getElementById('message');

    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:3000/api/admin-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('loggedInUserEmail', email);
                    sessionStorage.setItem('userRole', 'admin');
                    
                    messageDiv.textContent = 'Login successful!';
                    messageDiv.className = 'form-message success';
                    
                    window.location.href = 'admin.html';
                } else {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.className = 'form-message error';
                console.error('Admin login error:', error);
            }
        });
    }
});