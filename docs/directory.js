document.addEventListener('DOMContentLoaded', async () => {
    const alumniListContainer = document.getElementById('directory-list');
    const searchInput = document.getElementById('directory-search-input');
    const universityFilter = document.getElementById('university-filter');
    const majorFilter = document.getElementById('major-filter');
    const yearFilter = document.getElementById('year-filter');
    const cityFilter = document.getElementById('city-filter');
    const searchButton = document.getElementById('directory-search-button');
    const noResultsMessage = document.getElementById('no-results-message');
    const loadingMessage = document.getElementById('loading-message');

    const fetchAndRenderAlumni = async () => {
        if (!alumniListContainer || !loadingMessage || !noResultsMessage) {
            console.error('Core directory elements not found!');
            return;
        }

        loadingMessage.style.display = 'block';
        alumniListContainer.innerHTML = '';
        noResultsMessage.style.display = 'none';

        const query = searchInput.value;
        const university = universityFilter.value;
        const major = majorFilter.value;
        const year = yearFilter.value;
        const city = cityFilter.value;

        const params = new URLSearchParams({
            query,
            university,
            major,
            graduation_year: year,
            city
        });

        try {
            const response = await fetch(`http://localhost:3000/api/alumni?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const alumni = await response.json();
            
            loadingMessage.style.display = 'none';

            if (alumni.length > 0) {
                alumni.forEach(alumnus => {
                    const alumnusItem = document.createElement('div');
                    alumnusItem.classList.add('alumnus-list-item');
                    
                    const profilePicUrl = alumnus.profile_pic_url 
                        ? `http://localhost:3000/${alumnus.profile_pic_url}` 
                        : 'https://via.placeholder.com/150';

                    alumnusItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${alumnus.full_name}" class="alumnus-pfp-round">
                        <div class="alumnus-details">
                            <h3>${alumnus.full_name}</h3>
                            <p><i class="fas fa-briefcase"></i> ${alumnus.job_title ? alumnus.job_title + ' at ' : ''}${alumnus.current_company || 'N/A'}</p>
                            <p><i class="fas fa-graduation-cap"></i> ${alumnus.major || 'N/A'} | Class of ${alumnus.graduation_year || 'N/A'}</p>
                            <a href="view-profile.html?email=${alumnus.email}" class="btn btn-secondary">View Profile</a>
                        </div>
                    `;
                    alumniListContainer.appendChild(alumnusItem);
                });
            } else {
                noResultsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching alumni:', error);
            loadingMessage.style.display = 'none';
            alumniListContainer.innerHTML = '<p class="error-message">Failed to load alumni. Please check the console and try again later.</p>';
        }
    };

    // Initial load of all alumni
    fetchAndRenderAlumni();

    // Setup search functionality
    if (searchButton) {
        searchButton.addEventListener('click', fetchAndRenderAlumni);
    } else {
        console.error('Search button not found!');
    }

    // Add event listener for 'Enter' key on all filter inputs
    const filterInputs = [searchInput, universityFilter, majorFilter, yearFilter, cityFilter];
    filterInputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default form submission
                    fetchAndRenderAlumni();
                }
            });
        }
    });
});