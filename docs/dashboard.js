document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = sessionStorage.getItem('loggedInUserEmail');
    const userRole = sessionStorage.getItem('userRole');

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    if (userRole === 'admin') {
        window.location.href = 'admin.html';
        return;
    }

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/profile/${userEmail}`);
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            const user = await response.json();
            
            document.getElementById('profile-name').textContent = user.full_name;
            document.getElementById('profile-info').textContent = `${user.job_title} at ${user.current_company}`;
            
            const profilePic = document.getElementById('profile-pic');
            if (user.profile_pic_url) {
                profilePic.src = `http://localhost:3000/${user.profile_pic_url}`;
            } else {
                profilePic.src = 'https://via.placeholder.com/150';
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const fetchRecentEvents = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/events/recent');
            const events = await response.json();
            const eventsList = document.getElementById('recent-events-list');
            eventsList.innerHTML = '';
            if (events.length > 0) {
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${event.title}</strong> - ${event.location} <br><small>${new Date(event.date).toLocaleDateString()}</small>`;
                    eventsList.appendChild(li);
                });
            } else {
                eventsList.innerHTML = '<li>No recent events to display.</li>';
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchRecentJobs = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/jobs/recent');
            const jobs = await response.json();
            const jobsList = document.getElementById('recent-jobs-list');
            jobsList.innerHTML = '';
            if (jobs.length > 0) {
                jobs.forEach(job => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${job.title}</strong> at ${job.company} <br><small>${job.location}</small>`;
                    jobsList.appendChild(li);
                });
            } else {
                jobsList.innerHTML = '<li>No recent job postings to display.</li>';
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const fetchMyRsvps = async () => {
        const myEventsList = document.getElementById('my-events-list');
        try {
            const rsvpResponse = await fetch(`http://localhost:3000/api/user/rsvps?email=${encodeURIComponent(userEmail)}`);
            const rsvpEventIds = await rsvpResponse.json();

            if (rsvpEventIds.length > 0) {
                const eventsResponse = await fetch('http://localhost:3000/api/events/by-ids', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_ids: rsvpEventIds })
                });
                const events = await eventsResponse.json();
                myEventsList.innerHTML = '';
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${event.title}</strong> - ${event.location} <br><small>${event.date}</small>`;
                    myEventsList.appendChild(li);
                });
            } else {
                myEventsList.innerHTML = '<li>You have not responded to any upcoming events yet.</li>';
            }
        } catch (error) {
            console.error('Error fetching your RSVP\'d events:', error);
            myEventsList.innerHTML = '<li>Could not load your events.</li>';
        }
    };

    fetchUserProfile();
    fetchRecentEvents();
    fetchRecentJobs();
    fetchMyRsvps();
});