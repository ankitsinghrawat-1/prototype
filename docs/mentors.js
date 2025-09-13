document.addEventListener('DOMContentLoaded', async () => {
    const mentorsListContainer = document.getElementById('mentors-list');
    const loadingMessage = document.getElementById('loading-message');
    const noResultsMessage = document.getElementById('no-results-message');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    const checkMentorStatus = async () => {
        if (!loggedInUserEmail || !mentorActionArea) return;

        try {
            const response = await fetch(`http://localhost:3000/api/mentors/status?email=${encodeURIComponent(loggedInUserEmail)}`);
            const data = await response.json();

            if (data.isMentor) {
                mentorActionArea.innerHTML = `<a href="edit-mentor.html" class="btn btn-secondary"><i class="fas fa-edit"></i> Edit Mentor Profile</a>`;
            } else {
                mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
            }
        } catch (error) {
            console.error('Error checking mentor status:', error);
            mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
        }
    };

    const fetchAndRenderMentors = async () => {
        loadingMessage.style.display = 'block';

        try {
            const response = await fetch('http://localhost:3000/api/mentors');
            const mentors = await response.json();
            
            loadingMessage.style.display = 'none';
            mentorsListContainer.innerHTML = '';

            if (mentors.length > 0) {
                mentors.forEach(mentor => {
                    const mentorItem = document.createElement('div');
                    mentorItem.classList.add('alumnus-list-item');
                    
                    const profilePicUrl = mentor.profile_pic_url 
                        ? `http://localhost:3000/${mentor.profile_pic_url}` 
                        : 'https://via.placeholder.com/150';

                    mentorItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${mentor.full_name}" class="alumnus-pfp-round">
                        <div class="alumnus-details">
                            <h3>${mentor.full_name}</h3>
                            <p><i class="fas fa-briefcase"></i> ${mentor.job_title || 'N/A'} at ${mentor.current_company || 'N/A'}</p>
                            <p><i class="fas fa-star"></i> <strong>Expertise:</strong> ${mentor.expertise_areas || 'N/A'}</p>
                            <a href="view-profile.html?email=${mentor.email}" class="btn btn-secondary">View Profile</a>
                        </div>
                    `;
                    mentorsListContainer.appendChild(mentorItem);
                });
            } else {
                noResultsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
            loadingMessage.style.display = 'none';
            mentorsListContainer.innerHTML = '<p class="error-message">Failed to load mentors.</p>';
        }
    };

    checkMentorStatus();
    fetchAndRenderMentors();
});