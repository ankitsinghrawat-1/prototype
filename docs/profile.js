document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profile-form');
    const userEmail = sessionStorage.getItem('loggedInUserEmail');
    const navLinks = document.querySelectorAll('.profile-nav a');
    const pages = document.querySelectorAll('.profile-page');
    const profilePic = document.getElementById('profile-pic');
    const uploadBtn = document.getElementById('upload-btn');
    const pfpUpload = document.getElementById('profile_picture');
    const privacyForm = document.getElementById('privacy-form');
    const privacyMessage = document.getElementById('privacy-message');
    const passwordForm = document.getElementById('password-form');

    const displayMessage = (message, type = 'error', containerId = 'message') => {
        const messageContainer = document.getElementById(containerId);
        messageContainer.textContent = message;
        messageContainer.className = `form-message ${type}`;
        setTimeout(() => {
            messageContainer.textContent = '';
            messageContainer.className = 'form-message';
        }, 5000);
    }

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = e.target.getAttribute('data-tab');
            window.location.hash = targetTab;
        });
    });

    const handleTabSwitching = () => {
        const hash = window.location.hash.substring(1) || 'edit-profile';

        navLinks.forEach(nav => nav.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        const targetLink = document.querySelector(`.profile-nav a[data-tab="${hash}"]`);
        const targetPage = document.getElementById(hash);

        if (targetLink && targetPage) {
            targetLink.classList.add('active');
            targetPage.classList.add('active');
        } else {
            document.querySelector('.profile-nav a').classList.add('active');
            document.querySelector('.profile-page').classList.add('active');
        }
    };
    
    window.addEventListener('hashchange', handleTabSwitching);
    handleTabSwitching();

    uploadBtn.addEventListener('click', () => {
        pfpUpload.click();
    });

    pfpUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                profilePic.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    const populateProfileData = (data) => {
        document.getElementById('full_name').textContent = data.full_name || 'Not set';
        document.getElementById('email').textContent = data.email || 'Not set';
        document.getElementById('bio').textContent = data.bio || 'Not set';
        document.getElementById('current_company').textContent = data.current_company || 'Not set';
        document.getElementById('job_title').textContent = data.job_title || 'Not set';
        document.getElementById('city').textContent = data.city || 'Not set';
        document.getElementById('linkedin').textContent = data.linkedin || 'Not set';
        document.getElementById('university').textContent = data.university || 'Not set';
        document.getElementById('major').textContent = data.major || 'Not set';
        document.getElementById('graduation_year').textContent = data.graduation_year || 'Not set';
        document.getElementById('degree').textContent = data.degree || 'Not set';

        if (data.profile_pic_url) {
            profilePic.src = `http://localhost:3000/${data.profile_pic_url}`;
        } else {
            profilePic.src = 'https://via.placeholder.com/150';
        }
    };

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/profile/${userEmail}`);
            const data = await response.json();
            if (response.ok) {
                populateProfileData(data);
            } else {
                displayMessage('Failed to load profile data.');
            }
        } catch (error) {
            displayMessage('An error occurred while fetching profile data.');
        }
    };

    const fetchPrivacySettings = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/privacy/${userEmail}`);
            const settings = await response.json();
            if (response.ok) {
                document.getElementById('is_profile_public').checked = settings.is_profile_public;
                document.getElementById('is_email_visible').checked = settings.is_email_visible;
                document.getElementById('is_company_visible').checked = settings.is_company_visible;
                document.getElementById('is_location_visible').checked = settings.is_location_visible;
            }
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
        }
    };

    await fetchUserProfile();
    await fetchPrivacySettings();

    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const field = e.target.previousElementSibling;
            const display = field.previousElementSibling;
            
            if (field.style.display === 'none') {
                display.style.display = 'none';
                field.style.display = 'block';
                field.value = display.textContent === 'Not set' ? '' : display.textContent;
                e.target.classList.remove('fa-edit');
                e.target.classList.add('fa-save');
            } else {
                display.style.display = 'block';
                field.style.display = 'none';
                display.textContent = field.value || 'Not set';
                e.target.classList.remove('fa-save');
                e.target.classList.add('fa-edit');
            }
        });
    });

    document.querySelectorAll('.edit-field').forEach(field => {
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const icon = e.target.nextElementSibling;
                icon.click();
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        const fields = [
            'full_name', 'bio', 'current_company', 'job_title', 
            'city', 'linkedin', 'university', 'major', 
            'graduation_year', 'degree'
        ];
        fields.forEach(id => {
            const input = document.getElementById(`${id}_input`);
            if (input && input.style.display === 'block') {
                formData.append(id, input.value);
            } else {
                const display = document.getElementById(id);
                formData.append(id, display.textContent === 'Not set' ? '' : display.textContent);
            }
        });
        if (pfpUpload.files[0]) {
            formData.append('profile_picture', pfpUpload.files[0]);
        }
        try {
            const response = await fetch(`http://localhost:3000/api/profile/${userEmail}`, {
                method: 'PUT',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                displayMessage(data.message, 'success');
                await fetchUserProfile();
            } else {
                displayMessage(data.message);
            }
        } catch (error) {
            displayMessage('An error occurred while saving your profile.');
        }
    });

    privacyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const settings = {
            is_profile_public: document.getElementById('is_profile_public').checked,
            is_email_visible: document.getElementById('is_email_visible').checked,
            is_company_visible: document.getElementById('is_company_visible').checked,
            is_location_visible: document.getElementById('is_location_visible').checked
        };
        
        try {
            const response = await fetch(`http://localhost:3000/api/privacy/${userEmail}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const result = await response.json();
            privacyMessage.textContent = result.message;
            if (response.ok) {
                privacyMessage.className = 'form-message success';
            } else {
                privacyMessage.className = 'form-message error';
            }
        } catch (error) {
            privacyMessage.className = 'form-message error';
            privacyMessage.textContent = 'An error occurred while saving.';
        }
    });

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                displayMessage('New passwords do not match.', 'error', 'message');
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userEmail,
                        currentPassword,
                        newPassword
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    displayMessage(result.message, 'success', 'message');
                    passwordForm.reset();
                } else {
                    displayMessage(result.message, 'error', 'message');
                }
            } catch (error) {
                displayMessage('An error occurred. Please try again.', 'error', 'message');
            }
        });
    }
});