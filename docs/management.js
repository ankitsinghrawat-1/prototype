document.addEventListener('DOMContentLoaded', () => {
    const pageType = document.body.dataset.page;
    const listContainer = document.getElementById('management-list');

    if (!pageType || !listContainer) {
        console.error('Page type or list container not found.');
        return;
    }

    const apiConfig = {
        users: { url: 'admin/users', type: 'user' },
        events: { url: 'events', type: 'event' },
        jobs: { url: 'jobs', type: 'job' },
        campaigns: { url: 'campaigns', type: 'campaign' },
        applications: { url: 'admin/applications', type: 'application' }
    };

    const renderers = {
        users: (item) => `
            <tr>
                <td>${item.full_name}</td>
                <td>${item.email}</td>
                <td><span class="role-badge">${item.role}</span></td>
                <td><button class="btn btn-danger btn-sm delete-btn" data-id="${item.user_id}" data-type="user">Delete</button></td>
            </tr>`,
        events: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.location}</td>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>
                    <a href="edit-event.html?id=${item.event_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.event_id}" data-type="event">Delete</button>
                </td>
            </tr>`,
        jobs: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.company}</td>
                <td>${item.location}</td>
                <td>
                    <a href="edit-job.html?id=${item.job_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.job_id}" data-type="job">Delete</button>
                </td>
            </tr>`,
        campaigns: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>$${parseFloat(item.goal_amount).toLocaleString()}</td>
                <td>${new Date(item.end_date).toLocaleDateString()}</td>
                <td>
                    <a href="edit-campaign.html?id=${item.campaign_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.campaign_id}" data-type="campaign">Delete</button>
                </td>
            </tr>`,
        applications: (item) => `
            <tr>
                <td>${item.full_name}</td>
                <td>${item.user_email}</td>
                <td>${item.job_title}</td>
                <td>${new Date(item.application_date).toLocaleDateString()}</td>
                <td><a href="http://localhost:3000/${item.resume_path}" target="_blank" class="btn btn-secondary btn-sm">View Resume</a></td>
            </tr>`
    };

    const loadData = async () => {
        const config = apiConfig[pageType];
        if (!config) return;

        try {
            const response = await fetch(`http://localhost:3000/api/${config.url}`);
            const items = await response.json();
            
            if (items.length > 0) {
                listContainer.innerHTML = items.map(renderers[pageType]).join('');
            } else {
                listContainer.innerHTML = '<tr><td colspan="5" class="info-message">No items to display.</td></tr>';
            }
        } catch (error) {
            console.error(`Error fetching ${pageType}:`, error);
            listContainer.innerHTML = `<tr><td colspan="5" class="info-message error">Failed to load items.</td></tr>`;
        }
    };

    listContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;
            const config = Object.values(apiConfig).find(c => c.type === type);

            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                try {
                    const deleteUrl = (type === 'user') 
                        ? `http://localhost:3000/api/admin/${type}s/${id}`
                        : `http://localhost:3000/api/${config.url}/${id}`;
                        
                    const response = await fetch(deleteUrl, { method: 'DELETE' });

                    if (response.ok) {
                        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`, 'success');
                        loadData();
                    } else {
                        const result = await response.json();
                        showToast(`Error: ${result.message}`, 'error');
                    }
                } catch (error) {
                    console.error(`Error deleting ${type}:`, error);
                    showToast(`An error occurred while deleting the ${type}.`, 'error');
                }
            }
        }
    });

    loadData();
});