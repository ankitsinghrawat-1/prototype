document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const fullNameInput = document.getElementById('full_name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = fullNameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ full_name: fullName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Account created successfully. Please log in.', 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred. Please try again.', 'error');
        }
    });
});