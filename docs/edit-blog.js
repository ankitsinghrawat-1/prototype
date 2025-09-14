document.addEventListener('DOMContentLoaded', () => {
    const editBlogForm = document.getElementById('edit-blog-form');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    const userRole = sessionStorage.getItem('userRole');
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');
    const isUserEdit = params.get('user') === 'true'; // Check if it's a user editing their own post

    // Basic auth check
    if (!loggedInUserEmail || !blogId) {
        window.location.href = 'login.html';
        return;
    }

    const fetchBlogData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/blogs/${blogId}`);
            if (!response.ok) throw new Error('Blog post not found');
            const blog = await response.json();

            // Security Check: If not an admin, user must be the author
            if (userRole !== 'admin' && blog.author_email !== loggedInUserEmail) {
                showToast('You are not authorized to edit this post.', 'error');
                setTimeout(() => window.location.href = 'blogs.html', 1500);
                return;
            }
            
            document.getElementById('title').value = blog.title;
            document.getElementById('content').value = blog.content;
        } catch (error) {
            showToast(error.message, 'error');
            setTimeout(() => window.location.href = 'blogs.html', 1500);
        }
    };

    editBlogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const blogData = {
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
            email: loggedInUserEmail // Pass email for server-side authorization
        };

        try {
            const response = await fetch(`http://localhost:3000/api/blogs/${blogId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blogData)
            });
            const result = await response.json();
            if (response.ok) {
                showToast(result.message, 'success');
                // Redirect back to the correct page
                const redirectUrl = isUserEdit ? 'my-blogs.html' : 'blog-management.html';
                setTimeout(() => window.location.href = redirectUrl, 1500);
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred.', 'error');
        }
    });

    fetchBlogData();
});