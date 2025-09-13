const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));


app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('docs'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ankit@54328',
    database: 'alumni_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Create 'uploads' directory if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const resumeDir = path.join(__dirname, 'uploads', 'resumes');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
fs.mkdir(resumeDir, { recursive: true }).catch(console.error);

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'resume') {
            cb(null, resumeDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const userIdentifier = req.body.email ? req.body.email.split('@')[0] : 'user';
        cb(null, `${file.fieldname}-${userIdentifier}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });


// --- MENTORSHIP ENDPOINTS ---

app.post('/api/mentors', async (req, res) => {
    const { email, expertise_areas } = req.body;
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user_id = user[0].user_id;
        const [existingMentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
        if (existingMentor.length > 0) {
            return res.status(409).json({ message: 'You are already registered as a mentor.' });
        }
        await pool.query('INSERT INTO mentors (user_id, expertise_areas) VALUES (?, ?)', [user_id, expertise_areas]);
        res.status(201).json({ message: 'Successfully registered as a mentor!' });
    } catch (error) {
        console.error('Error registering mentor:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/mentors', async (req, res) => {
    try {
        const [mentors] = await pool.query(`
            SELECT u.full_name, u.job_title, u.current_company, u.profile_pic_url, u.email, m.expertise_areas
            FROM mentors m JOIN users u ON m.user_id = u.user_id WHERE m.is_available = TRUE
        `);
        res.json(mentors);
    } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/mentors/status', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.json({ isMentor: false });
        }
        const [mentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user[0].user_id]);
        res.json({ isMentor: mentor.length > 0 });
    } catch (error) {
        console.error('Error checking mentor status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/mentors/profile', async (req, res) => {
    const { email } = req.query;
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const [mentor] = await pool.query('SELECT expertise_areas FROM mentors WHERE user_id = ?', [user[0].user_id]);
        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        res.json(mentor[0]);
    } catch (error) {
        console.error('Error fetching mentor profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/mentors/profile', async (req, res) => {
    const { email, expertise_areas } = req.body;
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const [result] = await pool.query('UPDATE mentors SET expertise_areas = ? WHERE user_id = ?', [expertise_areas, user[0].user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mentor profile not found to update.' });
        }
        res.status(200).json({ message: 'Mentor profile updated successfully!' });
    } catch (error) {
        console.error('Error updating mentor profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/mentors/profile', async (req, res) => {
    const { email } = req.body;
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        await pool.query('DELETE FROM mentors WHERE user_id = ?', [user[0].user_id]);
        res.status(200).json({ message: 'You have been unlisted as a mentor.' });
    } catch (error) {
        console.error('Error unlisting mentor:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- PRIVACY SETTINGS ENDPOINTS ---

app.get('/api/privacy/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const [rows] = await pool.query('SELECT is_profile_public, is_email_visible, is_company_visible, is_location_visible FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching privacy settings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/privacy/:email', async (req, res) => {
    const { email } = req.params;
    const { is_profile_public, is_email_visible, is_company_visible, is_location_visible } = req.body;
    try {
        await pool.query(
            'UPDATE users SET is_profile_public = ?, is_email_visible = ?, is_company_visible = ?, is_location_visible = ? WHERE email = ?',
            [is_profile_public, is_email_visible, is_company_visible, is_location_visible, email]
        );
        res.status(200).json({ message: 'Privacy settings updated successfully' });
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- BLOG ENDPOINTS ---

app.get('/api/blogs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, u.full_name AS author, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id ORDER BY b.created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/blogs/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, u.full_name AS author, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id WHERE b.blog_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/blogs', async (req, res) => {
    const { title, content, author_email } = req.body;
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [author_email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Author not found' });
        }
        const author_id = user[0].user_id;
        await pool.query('INSERT INTO blogs (title, content, author_id) VALUES (?, ?, ?)', [title, content, author_id]);
        res.status(201).json({ message: 'Blog post created successfully' });
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- CAMPAIGN ENDPOINTS ---

app.post('/api/campaigns', async (req, res) => {
    const { title, description, goal_amount, start_date, end_date, image_url, admin_email } = req.body;
    try {
        const [admin] = await pool.query('SELECT user_id FROM users WHERE email = ? AND role = "admin"', [admin_email]);
        if (admin.length === 0) {
            return res.status(403).json({ message: 'Unauthorized: Only admins can create campaigns.' });
        }
        const created_by = admin[0].user_id;

        await pool.query(
            'INSERT INTO campaigns (title, description, goal_amount, start_date, end_date, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, goal_amount, start_date, end_date, image_url, created_by]
        );
        res.status(201).json({ message: 'Campaign created successfully!' });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/campaigns', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM campaigns ORDER BY end_date DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/campaigns/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM campaigns WHERE campaign_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching single campaign:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/campaigns/:id', async (req, res) => {
    const { title, description, goal_amount, start_date, end_date, image_url } = req.body;
    try {
        await pool.query(
            'UPDATE campaigns SET title = ?, description = ?, goal_amount = ?, start_date = ?, end_date = ?, image_url = ? WHERE campaign_id = ?',
            [title, description, goal_amount, start_date, end_date, image_url, req.params.id]
        );
        res.status(200).json({ message: 'Campaign updated successfully!' });
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/campaigns/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM campaigns WHERE campaign_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- MODIFIED ENDPOINTS TO RESPECT PRIVACY ---

app.get('/api/alumni', async (req, res) => {
    const { query, university, major, graduation_year, city } = req.query;
    try {
        let sql = 'SELECT * FROM users WHERE is_profile_public = TRUE';
        const params = [];

        if (query) {
            sql += ' AND (full_name LIKE ? OR current_company LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }
        if (university) {
            sql += ' AND university LIKE ?';
            params.push(`%${university}%`);
        }
        if (major) {
            sql += ' AND major LIKE ?';
            params.push(`%${major}%`);
        }
        if (graduation_year) {
            sql += ' AND graduation_year = ?';
            params.push(graduation_year);
        }
        if (city) {
            sql += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }

        const [rows] = await pool.query(sql, params);
        
        const publicProfiles = rows.map(user => {
            return {
                ...user,
                email: user.is_email_visible ? user.email : null,
                current_company: user.is_company_visible ? user.current_company : null,
                job_title: user.is_company_visible ? user.job_title : null,
                city: user.is_location_visible ? user.city : null,
            };
        });

        res.json(publicProfiles);
    } catch (error) {
        console.error('Error fetching alumni:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/profile/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        const user = rows[0];

        if (!user.is_profile_public) {
            return res.status(403).json({ 
                message: 'This profile is private.',
                full_name: user.full_name,
                profile_pic_url: user.profile_pic_url
            });
        }
        
        const publicProfile = {
            ...user,
            email: user.is_email_visible ? user.email : null,
            university_email: user.is_email_visible ? user.university_email : null,
            current_company: user.is_company_visible ? user.current_company : null,
            job_title: user.is_company_visible ? user.job_title : null,
            city: user.is_location_visible ? user.city : null,
        };

        res.json(publicProfile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// --- EVENT RSVP ENDPOINTS ---

app.post('/api/events/:id/rsvp', async (req, res) => {
    const event_id = req.params.id;
    const { email } = req.body;
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user_id = user[0].user_id;
        await pool.query('INSERT INTO event_rsvps (event_id, user_id) VALUES (?, ?)', [event_id, user_id]);
        res.status(201).json({ message: 'RSVP successful!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'You have already RSVP\'d to this event.' });
        }
        console.error('Error RSVPing to event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/events/:id/rsvp', async (req, res) => {
    const event_id = req.params.id;
    const { email } = req.body;
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user_id = user[0].user_id;
        await pool.query('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?', [event_id, user_id]);
        res.status(200).json({ message: 'RSVP canceled.' });
    } catch (error) {
        console.error('Error canceling RSVP:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/events/:id/attendees', async (req, res) => {
    try {
        const [attendees] = await pool.query(`
            SELECT u.full_name, u.profile_pic_url, u.email
            FROM users u
            JOIN event_rsvps er ON u.user_id = er.user_id
            WHERE er.event_id = ?
        `, [req.params.id]);
        res.json(attendees);
    } catch (error) {
        console.error('Error fetching attendees:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/user/rsvps', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user_id = user[0].user_id;
        const [rsvps] = await pool.query('SELECT event_id FROM event_rsvps WHERE user_id = ?', [user_id]);
        res.json(rsvps.map(r => r.event_id));
    } catch (error) {
        console.error('Error fetching user RSVPs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// --- ALL OTHER ENDPOINTS ---

app.post('/api/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [newPasswordHash, email]);

        res.status(200).json({ message: 'Password updated successfully!' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    // In a real application, you would add logic here to send a password reset email.
    // For now, we'll just simulate a success response.
    console.log(`Password reset requested for email: ${email}`);
    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
});

app.post('/api/jobs/:job_id/apply', upload.single('resume'), async (req, res) => {
    const { job_id } = req.params;
    const { email, full_name, cover_letter } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'A resume file is required.' });
    }
    const resume_path = `uploads/resumes/${req.file.filename}`;

    try {
        await pool.query(
            'INSERT INTO job_applications (job_id, user_email, full_name, resume_path, cover_letter) VALUES (?, ?, ?, ?, ?)',
            [job_id, email, full_name, resume_path, cover_letter]
        );
        res.status(201).json({ message: 'Application submitted successfully!' });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [events] = await pool.query('SELECT COUNT(*) as count FROM events');
        const [jobs] = await pool.query('SELECT COUNT(*) as count FROM jobs');
        const [mentors] = await pool.query('SELECT COUNT(*) as count FROM mentors');
        const [applications] = await pool.query('SELECT COUNT(*) as count FROM job_applications');

        res.json({
            totalUsers: users[0].count,
            totalEvents: events[0].count,
            totalJobs: jobs[0].count,
            totalMentors: mentors[0].count,
            totalApplications: applications[0].count
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/admin/applications', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                ja.full_name,
                ja.user_email,
                ja.resume_path,
                ja.application_date,
                j.title AS job_title
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.job_id
            ORDER BY ja.application_date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching applications for admin:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT user_id, full_name, email, role FROM users');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM events WHERE event_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM jobs WHERE job_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.cookie('loggedIn', 'true', { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 });
            res.status(200).json({ message: 'Login successful', role: user.role, email: user.email });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('loggedIn');
    res.status(200).json({ message: 'Logout successful' });
});

app.get('/api/check-login', (req, res) => {
    if (req.cookies.loggedIn) {
        res.status(200).json({ isLoggedIn: true });
    } else {
        res.status(200).json({ isLoggedIn: false });
    }
});

app.post('/api/signup', async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [full_name, email, password_hash]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/onboard', async (req, res) => {
    const { email, university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin } = req.body;
    try {
        await pool.query(
            'UPDATE users SET university = ?, university_email = ?, city = ?, graduation_year = ?, major = ?, degree = ?, current_company = ?, job_title = ?, bio = ?, linkedin = ?, onboarding_complete = TRUE WHERE email = ?',
            [university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin, email]
        );
        res.status(200).json({ message: 'Onboarding complete' });
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/profile/:email', upload.single('profile_picture'), async (req, res) => {
    const { email } = req.params;
    const { full_name, bio, current_company, job_title, city, linkedin, university, major, graduation_year, degree } = req.body;
    let profile_pic_url = req.file ? `uploads/${req.file.filename}` : undefined;
    try {
        const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userRows[0];
        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (bio !== undefined) updateData.bio = bio;
        if (current_company !== undefined) updateData.current_company = current_company;
        if (job_title !== undefined) updateData.job_title = job_title;
        if (city !== undefined) updateData.city = city;
        if (linkedin !== undefined) updateData.linkedin = linkedin || null;
        if (university !== undefined) updateData.university = university;
        if (major !== undefined) updateData.major = major;
        if (graduation_year !== undefined) updateData.graduation_year = graduation_year;
        if (degree !== undefined) updateData.degree = degree;
        if (profile_pic_url) {
            updateData.profile_pic_url = profile_pic_url;
            if (user.profile_pic_url) {
                const oldPicPath = path.join(__dirname, user.profile_pic_url);
                fs.unlink(oldPicPath).catch(err => console.error("Failed to delete old profile pic:", err));
            }
        }
        if (Object.keys(updateData).length > 0) {
            await pool.query('UPDATE users SET ? WHERE email = ?', [updateData, email]);
        }
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal Server Error', sqlMessage: error.sqlMessage });
    }
});

app.get('/api/events/recent', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT event_id, title, date, location, organizer FROM events ORDER BY date DESC LIMIT 3');
        const events = rows.map(row => ({
            ...row,
            date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        }));
        res.json(events);
    } catch (error) {
        console.error('Error fetching recent events:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/events/by-ids', async (req, res) => {
    const { event_ids } = req.body;
    if (!event_ids || event_ids.length === 0) {
        return res.json([]);
    }
    try {
        const placeholders = event_ids.map(() => '?').join(',');
        const [rows] = await pool.query(`SELECT event_id, title, date, location FROM events WHERE event_id IN (${placeholders}) ORDER BY date DESC`, event_ids);
        const events = rows.map(row => ({
            ...row,
            date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        }));
        res.json(events);
    } catch (error) {
        console.error('Error fetching events by IDs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/jobs/recent', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT job_id, title, company, location FROM jobs ORDER BY created_at DESC LIMIT 3');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching recent jobs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT event_id, title, description, date, location, organizer FROM events ORDER BY date DESC');
        const events = rows.map(row => ({
            ...row,
            date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        }));
        res.json(events);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/events/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching single event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/events/:id', async (req, res) => {
    const { title, description, date, location, organizer } = req.body;
    try {
        await pool.query(
            'UPDATE events SET title = ?, description = ?, date = ?, location = ?, organizer = ? WHERE event_id = ?',
            [title, description, date, location, organizer, req.params.id]
        );
        res.status(200).json({ message: 'Event updated successfully!' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/jobs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all jobs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/jobs/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM jobs WHERE job_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching single job:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/jobs/:id', async (req, res) => {
    const { title, description, company, location, contact_email } = req.body;
    try {
        await pool.query(
            'UPDATE jobs SET title = ?, description = ?, company = ?, location = ?, contact_email = ? WHERE job_id = ?',
            [title, description, company, location, contact_email, req.params.id]
        );
        res.status(200).json({ message: 'Job updated successfully!' });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/jobs', async (req, res) => {
    const { title, company, location, description, contact_email } = req.body;
    try {
        await pool.query('INSERT INTO jobs (title, company, location, description, contact_email) VALUES (?, ?, ?, ?, ?)', [title, company, location, description, contact_email]);
        res.status(201).json({ message: 'Job added successfully' });
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ message: 'Failed to add job' });
    }
});

app.post('/api/events', async (req, res) => {
    const { title, date, location, organizer, description } = req.body;
    try {
        await pool.query('INSERT INTO events (title, date, location, organizer, description) VALUES (?, ?, ?, ?, ?)', [title, date, location, organizer, description]);
        res.status(201).json({ message: 'Event added successfully' });
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ message: 'Failed to add event' });
    }
});

app.post('/api/admin-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.cookie('loggedIn', 'true', { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 });
            res.status(200).json({ message: 'Admin login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});