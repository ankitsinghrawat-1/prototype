document.addEventListener('DOMContentLoaded', () => {
    const editBlogForm = document.getElementById('edit-blog-form');
    const userRole = sessionStorage.getItem('userRole');
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');

    if (userRole !== 'admin' || !blogId) {
        window.location.href = 'index.html';
        return;
    }

    const fetchBlogData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/blogs/${blogId}`);
            if (!response.ok) throw new Error('Blog post not found');
            const blog = await response.json();
            
            document.getElementById('title').value = blog.title;
            document.getElementById('content').value = blog.content;
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editBlogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const blogData = {
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
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
                setTimeout(() => window.location.href = 'blog-management.html', 1500);
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred.', 'error');
        }
    });

    fetchBlogData();
});