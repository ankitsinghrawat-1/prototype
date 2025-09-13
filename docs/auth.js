document.addEventListener('DOMContentLoaded', async () => {
    const navLinks = document.getElementById('nav-links');

    if (!navLinks) {
        console.error("Error: Navigation element with ID 'nav-links' was not found.");
        return;
    }

    // The most reliable check is the data saved in the browser's session storage after login.
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    const userRole = sessionStorage.getItem('userRole');

    const navItems = document.createElement('ul');
    navItems.className = 'nav-links';

    // NEW LOGIC: We now primarily check if the user's email is stored in the session.
    if (loggedInUserEmail) {
        // --- LOGGED-IN VIEW ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Connect <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="directory.html">Directory</a></li>
                    <li><a href="mentors.html">Mentors</a></li>
                    <li><a href="events.html">Events</a></li>
                </ul>
            </li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Resources <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="blogs.html">Blog</a></li>
                    <li><a href="jobs.html">Job Board</a></li>
                    <li><a href="campaigns.html">Campaigns</a></li>
                </ul>
            </li>
            ${userRole === 'admin' ? `<li><a href="admin.html" class="btn btn-secondary">Admin Dashboard</a></li>` : `<li><a href="dashboard.html" class="btn btn-secondary">Dashboard</a></li>`}
            <li class="profile-dropdown nav-dropdown">
                <a href="#" class="dropdown-toggle btn btn-primary">Profile</a>
                <ul class="dropdown-menu">
                    <li><a href="profile.html#edit-profile"><i class="fas fa-user-edit"></i> Edit Profile</a></li>
                    <li><a href="profile.html#change-password"><i class="fas fa-key"></i> Change Password</a></li>
                    <li><a href="profile.html#privacy-settings"><i class="fas fa-user-shield"></i> Privacy Settings</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button id="logout-btn" class="logout-button"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
                </ul>
            </li>
        `;
    } else {
        // --- LOGGED-OUT VIEW ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li><a href="blogs.html">Blog</a></li>
            <li><a href="login.html" class="btn btn-secondary">Log In</a></li>
            <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
        `;
    }

    navLinks.innerHTML = '';
    navLinks.appendChild(navItems);

    // --- All event listeners remain the same ---
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const parentDropdown = e.currentTarget.parentElement;
            
            document.querySelectorAll('.nav-dropdown').forEach(dd => {
                if (dd !== parentDropdown) {
                    dd.classList.remove('dropdown-active');
                }
            });

            parentDropdown.classList.toggle('dropdown-active');
        });
    });
    
    window.addEventListener('click', () => {
        document.querySelectorAll('.nav-dropdown').forEach(dd => {
            dd.classList.remove('dropdown-active');
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            sessionStorage.removeItem('loggedInUserEmail');
            sessionStorage.removeItem('userRole');
            // We still contact the server to clear the httpOnly cookie
            await fetch('http://localhost:3000/api/logout', { method: 'POST', credentials: 'include' });
            window.location.href = 'index.html';
        });
    }

    // This part now uses the reliable sessionStorage check
    const path = window.location.pathname;
    const isIndexPage = path === '/' || path.endsWith('/index.html') || path.endsWith('/');
    if (isIndexPage) {
        const loggedInHeader = document.getElementById('loggedIn-header');
        const loggedOutHeader = document.getElementById('loggedOut-header');
        if (loggedInHeader && loggedOutHeader) {
            loggedInHeader.style.display = loggedInUserEmail ? 'block' : 'none';
            loggedOutHeader.style.display = loggedInUserEmail ? 'none' : 'block';
        }
    }
});