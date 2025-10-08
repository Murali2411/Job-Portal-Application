// Job Portal Frontend Application - 2 Roles: Job Seeker & Recruiter
class JobPortalApp {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.currentPage = 'home';
        this.captchaText = '';
        this.init();
    }

    init() {
        this.bindEvents();
        if (this.token && this.user.email) {
            this.showDashboard();
        } else {
            this.showHome();
        }
    }

    bindEvents() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('registerPassword')?.addEventListener('input', (e) => {
            this.validatePassword(e.target.value);
        });

        document.getElementById('registerEmail')?.addEventListener('blur', (e) => {
            this.validateEmail(e.target.value);
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    generateCaptcha() {
        const canvas = document.getElementById('captchaCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        this.captchaText = '';
        for (let i = 0; i < 6; i++) {
            this.captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.3)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
        
        ctx.font = 'bold 32px Arial';
        for (let i = 0; i < this.captchaText.length; i++) {
            ctx.save();
            ctx.translate(20 + i * 30, 40);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillStyle = `rgb(${Math.random()*100},${Math.random()*100},${Math.random()*100})`;
            ctx.fillText(this.captchaText[i], 0, 0);
            ctx.restore();
        }
        
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }
    }

    validateCaptcha() {
        const userInput = document.getElementById('captchaInput').value.toUpperCase();
        if (userInput !== this.captchaText) {
            this.showModalAlert('loginModal', 'Incorrect CAPTCHA. Please try again.', 'error');
            this.generateCaptcha();
            document.getElementById('captchaInput').value = '';
            return false;
        }
        return true;
    }

    validatePassword(password) {
        const errorDiv = document.getElementById('passwordError');
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            errorDiv.style.display = 'block';
            return false;
        } else {
            errorDiv.style.display = 'none';
            return true;
        }
    }

    validateEmail(email) {
        const errorDiv = document.getElementById('emailError');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Please enter a valid email address';
            errorDiv.style.display = 'block';
            return false;
        } else {
            errorDiv.style.display = 'none';
            return true;
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!this.validateCaptcha()) {
            return;
        }

        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = { email, role: data.role };
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showModalAlert('loginModal', 'Login successful!', 'success');
                setTimeout(() => {
                    this.hideModal('loginModal');
                    this.showDashboard();
                }, 1000);
            } else {
                this.showModalAlert('loginModal', data.message || 'Login failed', 'error');
                this.generateCaptcha();
                document.getElementById('captchaInput').value = '';
            }
        } catch (error) {
            this.showModalAlert('loginModal', 'Network error. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;

        if (!this.validateEmail(email) || !this.validatePassword(password)) {
            this.showModalAlert('registerModal', 'Please fix the errors above', 'error');
            return;
        }

        if (!role) {
            this.showModalAlert('registerModal', 'Please select your role', 'error');
            return;
        }

        const submitBtn = document.querySelector('#registerForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                this.showModalAlert('registerModal', 'Registration successful! Please login.', 'success');
                setTimeout(() => {
                    this.hideModal('registerModal');
                    this.showModal('loginModal');
                    document.getElementById('loginEmail').value = email;
                }, 1500);
            } else {
                this.showModalAlert('registerModal', data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showModalAlert('registerModal', 'Network error. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    logout() {
        this.token = null;
        this.user = {};
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showHome();
        this.showAlert('Logged out successfully', 'info');
    }

    async apiCall(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (response.status === 401) {
                this.logout();
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    showHome() {
        const homeSection = document.getElementById('homeSection');
        const mainContent = document.querySelector('.main-content');
        if (homeSection) homeSection.style.display = 'block';
        if (mainContent) mainContent.style.display = 'block';
        
        document.getElementById('dashboard').classList.remove('show');
        document.getElementById('navLinks').style.display = 'flex';
        document.getElementById('userInfo').classList.add('hidden');
        this.currentPage = 'home';
    }

    showDashboard() {
        const homeSection = document.getElementById('homeSection');
        const mainContent = document.querySelector('.main-content');
        if (homeSection) homeSection.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        
        document.getElementById('dashboard').classList.add('show');
        document.getElementById('navLinks').style.display = 'none';
        document.getElementById('userInfo').classList.remove('hidden');
        
        this.updateUserInfo();
        this.loadSidebarMenu();
        this.loadDashboardContent();
        this.currentPage = 'dashboard';
    }

    updateUserInfo() {
        const userName = this.user.name || this.user.email?.split('@')[0] || 'User';
        const avatar = userName.charAt(0).toUpperCase();
        
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = avatar;
        document.getElementById('dashboardUserName').textContent = userName;
        document.getElementById('dashboardAvatar').textContent = avatar;
    }

    loadSidebarMenu() {
        const menuItems = this.getSidebarMenuItems();
        const sidebarMenu = document.getElementById('sidebarMenu');
        
        sidebarMenu.innerHTML = menuItems.map(item => `
            <li>
                <a href="#" onclick="app.loadPage('${item.page}')" class="${item.page === 'overview' ? 'active' : ''}">
                    <i class="${item.icon}"></i>
                    ${item.label}
                </a>
            </li>
        `).join('');
    }

    getSidebarMenuItems() {
        const commonItems = [
            { page: 'overview', label: 'Dashboard', icon: 'fas fa-tachometer-alt' }
        ];

        if (this.user.role === 'CANDIDATE') {
            return [
                ...commonItems,
                { page: 'jobs', label: 'Browse Jobs', icon: 'fas fa-search' },
                { page: 'applications', label: 'My Applications', icon: 'fas fa-file-alt' },
                { page: 'profile', label: 'My Profile', icon: 'fas fa-user' }
            ];
        } else if (this.user.role === 'RECRUITER') {
            return [
                ...commonItems,
                { page: 'my-jobs', label: 'My Job Posts', icon: 'fas fa-briefcase' },
                { page: 'post-job', label: 'Post New Job', icon: 'fas fa-plus-circle' },
                { page: 'received-applications', label: 'Applications Received', icon: 'fas fa-inbox' },
                { page: 'profile', label: 'Company Profile', icon: 'fas fa-building' }
            ];
        }

        return commonItems;
    }

    async loadPage(page) {
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[onclick="app.loadPage('${page}')"]`)?.classList.add('active');

        const content = document.getElementById('dashboardContent');
        content.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            switch (page) {
                case 'overview':
                    await this.loadOverview();
                    break;
                case 'jobs':
                    await this.loadJobs();
                    break;
                case 'applications':
                    await this.loadMyApplications();
                    break;
                case 'my-jobs':
                    await this.loadMyJobs();
                    break;
                case 'post-job':
                    await this.loadPostJob();
                    break;
                case 'received-applications':
                    await this.loadReceivedApplications();
                    break;
                case 'profile':
                    await this.loadProfile();
                    break;
                default:
                    content.innerHTML = '<div class="card"><h2>Page not found</h2></div>';
            }
        } catch (error) {
            content.innerHTML = '<div class="card"><h2>Error</h2><p>Please try again.</p></div>';
        }
    }

    loadDashboardContent() {
        this.loadPage('overview');
    }

    async loadOverview() {
        const content = document.getElementById('dashboardContent');
        
        if (this.user.role === 'CANDIDATE') {
            try {
                const stats = await this.apiCall('/applications/stats');
                
                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1>Welcome back, Job Seeker!</h1>
                        <p>Track your job applications and find new opportunities</p>
                    </div>
                    <div class="stats-grid fade-in">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-paper-plane"></i></div>
                            <div class="stat-value">${stats.total || 0}</div>
                            <div class="stat-label">Total Applications</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-clock"></i></div>
                            <div class="stat-value">${stats.pending || 0}</div>
                            <div class="stat-label">Pending</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-star"></i></div>
                            <div class="stat-value">${stats.shortlisted || 0}</div>
                            <div class="stat-label">Shortlisted</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                            <div class="stat-value">${stats.accepted || 0}</div>
                            <div class="stat-label">Accepted</div>
                        </div>
                    </div>
                    <div class="card fade-in">
                        <h3><i class="fas fa-rocket"></i> Quick Actions</h3>
                        <div class="quick-actions">
                            <button onclick="app.loadPage('jobs')" class="btn btn-primary btn-large">
                                <i class="fas fa-search"></i> Browse Jobs
                            </button>
                            <button onclick="app.loadPage('applications')" class="btn btn-outline btn-large">
                                <i class="fas fa-file-alt"></i> My Applications
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                content.innerHTML = '<div class="card">Error loading stats</div>';
            }
        } else if (this.user.role === 'RECRUITER') {
            try {
                const jobsResponse = await fetch(`${this.baseURL}/jobs/my-jobs?size=1`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                const jobsData = await jobsResponse.json();
                const activeJobs = jobsData.totalElements || 0;

                const statsResponse = await fetch(`${this.baseURL}/applications/recruiter/stats`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                const statsData = await statsResponse.json();
                const totalApplicants = statsData.totalApplicants || 0;

                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1>Welcome back, Recruiter!</h1>
                        <p>Manage your job postings and find great candidates</p>
                    </div>
                    <div class="stats-grid fade-in">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
                            <div class="stat-value">${activeJobs}</div>
                            <div class="stat-label">Active Jobs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-value">${totalApplicants}</div>
                            <div class="stat-label">Total Applicants</div>
                        </div>
                    </div>
                    <div class="card fade-in">
                        <h3><i class="fas fa-rocket"></i> Quick Actions</h3>
                        <div class="quick-actions">
                            <button onclick="app.loadPage('post-job')" class="btn btn-primary btn-large">
                                <i class="fas fa-plus-circle"></i> Post New Job
                            </button>
                            <button onclick="app.loadPage('my-jobs')" class="btn btn-outline btn-large">
                                <i class="fas fa-briefcase"></i> Manage Jobs
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                content.innerHTML = '<div class="card">Error loading stats</div>';
            }
        }
    }

    async loadJobs() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = `
            <div class="page-header fade-in">
                <h1><i class="fas fa-search"></i> Browse Jobs</h1>
                <p>Find your next opportunity</p>
            </div>
            <div class="card fade-in">
                <div class="search-filters">
                    <input type="text" id="jobSearch" placeholder="Search by job title, company, or skills..." class="form-control search-input">
                    <select id="jobTypeFilter" class="form-control form-select">
                        <option value="">All Job Types</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERNSHIP">Internship</option>
                        <option value="REMOTE">Remote</option>
                    </select>
                    <input type="text" id="locationFilter" placeholder="Location..." class="form-control">
                    <button onclick="app.searchJobs()" class="btn btn-primary">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
            </div>
            <div id="jobResults">
                <div class="loading-container"><div class="spinner"></div></div>
            </div>
        `;
        
        this.searchJobs();
    }

    async searchJobs() {
        const keyword = document.getElementById('jobSearch')?.value || '';
        const jobType = document.getElementById('jobTypeFilter')?.value || '';
        const location = document.getElementById('locationFilter')?.value || '';
        
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (jobType) params.append('jobType', jobType);
        if (location) params.append('location', location);
        
        try {
            const response = await fetch(`${this.baseURL}/jobs/public?${params}`, {
                headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
            });
            const data = await response.json();
            
            this.displayJobs(data.content || []);
        } catch (error) {
            document.getElementById('jobResults').innerHTML = '<div class="card">Error loading jobs</div>';
        }
    }

    displayJobs(jobs) {
        const container = document.getElementById('jobResults');
        if (!jobs.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No jobs found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="job-grid">
                ${jobs.map(job => `
                    <div class="job-card fade-in">
                        <div class="job-card-header">
                            <div>
                                <h3 class="job-title">${job.title}</h3>
                                <p class="job-company"><i class="fas fa-building"></i> ${job.company}</p>
                            </div>
                            <span class="job-badge job-badge-${job.jobType.toLowerCase()}">${this.formatJobType(job.jobType)}</span>
                        </div>
                        <div class="job-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Remote'}</span>
                            <span><i class="fas fa-calendar"></i> Posted ${this.formatDate(job.createdAt)}</span>
                            ${job.maxSalary ? `<span><i class="fas fa-money-bill-wave"></i> $${job.minSalary}k - $${job.maxSalary}k</span>` : ''}
                        </div>
                        <p class="job-description">${this.truncateText(job.description, 150)}</p>
                        ${job.skills ? `
                            <div class="job-skills">
                                ${job.skills.split(',').slice(0, 5).map(skill => 
                                    `<span class="skill-tag">${skill.trim()}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                        <div class="job-actions">
                            ${this.user.role === 'CANDIDATE' ? `
                                <button onclick="app.showApplyModal(${job.jobId}, '${job.title.replace(/'/g, "\\'")}', '${job.company.replace(/'/g, "\\'")}' )" class="btn btn-primary btn-block">
                                    <i class="fas fa-paper-plane"></i> Apply Now
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showApplyModal(jobId, jobTitle, company) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'applyModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <button class="close-modal" onclick="document.getElementById('applyModal').remove()">&times;</button>
                <div class="modal-header">
                    <h2><i class="fas fa-paper-plane"></i> Apply for Position</h2>
                    <p class="modal-subtitle">${jobTitle} at ${company}</p>
                </div>
                <div id="applyModalAlert"></div>
                <form id="applyForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicantName">Full Name *</label>
                            <input type="text" id="applicantName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="applicantEmail">Email *</label>
                            <input type="email" id="applicantEmail" class="form-control" value="${this.user.email}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicantPhone">Phone Number *</label>
                            <input type="tel" id="applicantPhone" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="applicantAddress">Address *</label>
                            <input type="text" id="applicantAddress" class="form-control" placeholder="City, Country" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="resumeLink">Resume Link *</label>
                        <input type="url" id="resumeLink" class="form-control" placeholder="https://drive.google.com/..." required>
                        <small class="form-hint"><i class="fas fa-info-circle"></i> Upload your resume to Google Drive/Dropbox, set to "Anyone with link can view", and paste the link here</small>
                    </div>
                    <div class="form-group">
                        <label for="coverLetterLink">Cover Letter Link (Optional)</label>
                        <input type="url" id="coverLetterLink" class="form-control" placeholder="https://drive.google.com/...">
                        <small class="form-hint"><i class="fas fa-info-circle"></i> Upload cover letter and paste link, or leave blank to write below</small>
                    </div>
                    <div class="form-group">
                        <label for="coverLetter">Or Write Cover Letter (Optional)</label>
                        <textarea id="coverLetter" class="form-control" rows="5" placeholder="Tell us why you're a great fit for this role..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-large">
                        <i class="fas fa-paper-plane"></i> Submit Application
                    </button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('applyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitApplication(jobId);
        });
    }

    async submitApplication(jobId) {
    const name = document.getElementById('applicantName').value;
    const email = document.getElementById('applicantEmail').value;
    const phone = document.getElementById('applicantPhone').value;
    const address = document.getElementById('applicantAddress').value;
    const resumeLink = document.getElementById('resumeLink').value;
    const coverLetterLink = document.getElementById('coverLetterLink').value;
    const coverLetter = document.getElementById('coverLetter').value;

    // Build cover letter text with all info
    let coverLetterText = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}\nResume: ${resumeLink}`;
    
    if (coverLetterLink) {
        coverLetterText += `\nCover Letter Link: ${coverLetterLink}`;
    }
    
    if (coverLetter) {
        coverLetterText += `\n\nCover Letter:\n${coverLetter}`;
    }

    const submitBtn = document.querySelector('#applyForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
        const params = new URLSearchParams({
            jobId: jobId,
            coverLetter: coverLetterText
        });
        
        const response = await fetch(`${this.baseURL}/applications/apply?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        const data = await response.json();
        console.log('Application response:', data); // Debug

        if (response.ok) {
            this.showAlert('Application submitted successfully!', 'success');
            document.getElementById('applyModal').remove();
            // Reload applications page
            setTimeout(() => {
                this.loadPage('applications');
            }, 1000);
        } else {
            const alertContainer = document.getElementById('applyModalAlert');
            alertContainer.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Application error:', error);
        const alertContainer = document.getElementById('applyModalAlert');
        alertContainer.innerHTML = '<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> Network error. Please try again.</div>';
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

    async loadMyApplications() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            const response = await fetch(`${this.baseURL}/applications/my-applications`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load applications');
            }

            const data = await response.json();
            console.log('Applications data:', data); // DEBUG
            
            const applications = data.content || [];

            if (!applications.length) {
                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1><i class="fas fa-file-alt"></i> My Applications</h1>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No applications yet</h3>
                        <p>Start browsing jobs and apply to positions that interest you!</p>
                        <button onclick="app.loadPage('jobs')" class="btn btn-primary btn-large">
                            <i class="fas fa-search"></i> Browse Jobs
                        </button>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-file-alt"></i> My Applications</h1>
                    <p>Track the status of your job applications</p>
                </div>
                <div class="applications-list">
                    ${applications.map(app => `
                        <div class="application-card fade-in">
                            <div class="application-header">
                                <div>
                                    <h3>${app.jobTitle || 'Job Title'}</h3>
                                    <p class="company-name"><i class="fas fa-building"></i> ${app.company || 'Company'}</p>
                                </div>
                                <span class="status-badge status-${(app.status || 'pending').toLowerCase()}">${this.formatStatus(app.status || 'PENDING')}</span>
                            </div>
                            <div class="application-meta">
                                <span><i class="fas fa-calendar"></i> Applied ${this.formatDate(app.appliedAt)}</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${app.jobLocation || 'Remote'}</span>
                            </div>
                            ${app.coverLetter ? `
                                <div class="cover-letter-preview">
                                    <strong><i class="fas fa-file-alt"></i> Application Details:</strong>
                                    <p>${this.truncateText(app.coverLetter, 300)}</p>
                                </div>
                            ` : ''}
                            <div class="application-actions">
                                ${app.status === 'PENDING' || app.status === 'REVIEWED' ? `
                                    <button onclick="app.withdrawApplication(${app.applicationId})" class="btn btn-outline btn-danger">
                                        <i class="fas fa-times"></i> Withdraw Application
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading applications:', error);
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-file-alt"></i> My Applications</h1>
                </div>
                <div class="card">
                    <h3>Unable to load applications</h3>
                    <p>There was an error loading your applications. Please try refreshing the page.</p>
                    <button onclick="app.loadMyApplications()" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    async withdrawApplication(applicationId) {
        if (!confirm('Are you sure you want to withdraw this application?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/applications/${applicationId}/withdraw`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showAlert('Application withdrawn successfully', 'success');
                this.loadMyApplications();
            } else {
                this.showAlert('Failed to withdraw application', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    async loadMyJobs() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading jobs...</p></div>';

        try {
            const response = await fetch(`${this.baseURL}/jobs/my-jobs`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            const jobs = data.content || [];

            if (!jobs.length) {
                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1><i class="fas fa-briefcase"></i> My Job Posts</h1>
                        <p>Manage your active job listings</p>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-briefcase"></i>
                        <h3>No jobs posted yet</h3>
                        <p>Create your first job posting to start receiving applications</p>
                        <button onclick="app.loadPage('post-job')" class="btn btn-primary btn-large">
                            <i class="fas fa-plus-circle"></i> Post Your First Job
                        </button>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-briefcase"></i> My Job Posts</h1>
                    <p>Manage your active job listings</p>
                </div>
                <div class="job-grid">
                    ${jobs.map(job => `
                        <div class="job-card fade-in">
                            <div class="job-card-header">
                                <div>
                                    <h3 class="job-title">${job.title}</h3>
                                    <p class="job-company"><i class="fas fa-building"></i> ${job.company}</p>
                                </div>
                                <span class="job-badge job-badge-${job.jobType.toLowerCase()}">${this.formatJobType(job.jobType)}</span>
                            </div>
                            <div class="job-meta">
                                <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Remote'}</span>
                                <span><i class="fas fa-calendar"></i> Posted ${this.formatDate(job.createdAt)}</span>
                                <span><i class="fas fa-eye"></i> ${job.status}</span>
                            </div>
                            <p class="job-description">${this.truncateText(job.description, 150)}</p>
                            ${job.skills ? `
                                <div class="job-skills">
                                    ${job.skills.split(',').slice(0, 5).map(skill => 
                                        `<span class="skill-tag">${skill.trim()}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                            <div class="job-actions">
                                <button onclick="app.editJob(${job.jobId})" class="btn btn-outline">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="app.deleteJob(${job.jobId})" class="btn btn-outline btn-danger">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = '<div class="card">Error loading jobs</div>';
        }
    }

    async editJob(jobId) {
        try {
            const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const job = await response.json();

            const content = document.getElementById('dashboardContent');
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-edit"></i> Edit Job</h1>
                    <p>Update your job posting</p>
                </div>
                <div class="card fade-in">
                    <form id="editJobForm" class="job-post-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editJobTitle">Job Title *</label>
                                <input type="text" id="editJobTitle" class="form-control" value="${job.title}" required>
                            </div>
                            <div class="form-group">
                                <label for="editCompany">Company Name *</label>
                                <input type="text" id="editCompany" class="form-control" value="${job.company}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editJobDescription">Job Description *</label>
                            <textarea id="editJobDescription" class="form-control" rows="6" required>${job.description}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editJobType">Job Type *</label>
                                <select id="editJobType" class="form-control form-select" required>
                                    <option value="FULL_TIME" ${job.jobType === 'FULL_TIME' ? 'selected' : ''}>Full Time</option>
                                    <option value="PART_TIME" ${job.jobType === 'PART_TIME' ? 'selected' : ''}>Part Time</option>
                                    <option value="CONTRACT" ${job.jobType === 'CONTRACT' ? 'selected' : ''}>Contract</option>
                                    <option value="INTERNSHIP" ${job.jobType === 'INTERNSHIP' ? 'selected' : ''}>Internship</option>
                                    <option value="REMOTE" ${job.jobType === 'REMOTE' ? 'selected' : ''}>Remote</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editLocation">Location *</label>
                                <input type="text" id="editLocation" class="form-control" value="${job.location || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editMinSalary">Min Salary (in thousands)</label>
                                <input type="number" id="editMinSalary" class="form-control" value="${job.minSalary || ''}">
                            </div>
                            <div class="form-group">
                                <label for="editMaxSalary">Max Salary (in thousands)</label>
                                <input type="number" id="editMaxSalary" class="form-control" value="${job.maxSalary || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editSkills">Required Skills</label>
                            <input type="text" id="editSkills" class="form-control" value="${job.skills || ''}">
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" onclick="app.loadPage('my-jobs')" class="btn btn-outline">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button type="submit" class="btn btn-primary btn-large">
                                <i class="fas fa-save"></i> Update Job
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.getElementById('editJobForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateJob(jobId);
            });
        } catch (error) {
            this.showAlert('Error loading job details', 'error');
        }
    }

    async updateJob(jobId) {
        const deadlineValue = document.getElementById('editApplicationDeadline')?.value;
        let formattedDeadline = null;
        if (deadlineValue) {
            formattedDeadline = new Date(deadlineValue).toISOString();
        }

        const jobData = {
            title: document.getElementById('editJobTitle').value,
            company: document.getElementById('editCompany').value,
            description: document.getElementById('editJobDescription').value,
            jobType: document.getElementById('editJobType').value,
            location: document.getElementById('editLocation').value,
            minSalary: document.getElementById('editMinSalary').value || null,
            maxSalary: document.getElementById('editMaxSalary').value || null,
            skills: document.getElementById('editSkills').value || null,
            applicationDeadline: formattedDeadline,
            requirements: null,
            benefits: null,
            experience: null,
            education: null
        };

        try {
            const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(jobData)
            });

            if (response.ok) {
                this.showAlert('Job updated successfully!', 'success');
                this.loadPage('my-jobs');
            } else {
                this.showAlert('Failed to update job', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    async deleteJob(jobId) {
        if (!confirm('Are you sure you want to delete this job?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showAlert('Job deleted successfully', 'success');
                this.loadMyJobs();
            } else {
                this.showAlert('Failed to delete job', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    async loadPostJob() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = `
            <div class="page-header fade-in">
                <h1><i class="fas fa-plus-circle"></i> Post a New Job</h1>
                <p>Attract top talent to your company</p>
            </div>
            <div class="card fade-in">
                <form id="postJobForm" class="job-post-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="jobTitle">Job Title *</label>
                            <input type="text" id="jobTitle" class="form-control" placeholder="e.g. Senior Software Engineer" required>
                        </div>
                        <div class="form-group">
                            <label for="company">Company Name *</label>
                            <input type="text" id="company" class="form-control" placeholder="Your company name" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="jobDescription">Job Description *</label>
                        <textarea id="jobDescription" class="form-control" rows="6" placeholder="Describe the role, responsibilities, and requirements..." required></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="jobType">Job Type *</label>
                            <select id="jobType" class="form-control form-select" required>
                                <option value="">Select job type</option>
                                <option value="FULL_TIME">Full Time</option>
                                <option value="PART_TIME">Part Time</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="INTERNSHIP">Internship</option>
                                <option value="REMOTE">Remote</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="location">Location *</label>
                            <input type="text" id="location" class="form-control" placeholder="City, Country or Remote" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="minSalary">Min Salary (in thousands)</label>
                            <input type="number" id="minSalary" class="form-control" placeholder="e.g. 50">
                        </div>
                        <div class="form-group">
                            <label for="maxSalary">Max Salary (in thousands)</label>
                            <input type="number" id="maxSalary" class="form-control" placeholder="e.g. 80">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="skills">Required Skills</label>
                        <input type="text" id="skills" class="form-control" placeholder="e.g. JavaScript, React, Node.js (comma separated)">
                        <small class="form-hint">Separate skills with commas</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="applicationDeadline">Application Deadline</label>
                        <input type="date" id="applicationDeadline" class="form-control">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-large">
                            <i class="fas fa-paper-plane"></i> Post Job
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('postJobForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitJobPost();
        });
    }

    async submitJobPost() {
        const deadlineValue = document.getElementById('applicationDeadline').value;
        let formattedDeadline = null;
        
        if (deadlineValue) {
            formattedDeadline = new Date(deadlineValue).toISOString();
        }

        const minSalaryValue = document.getElementById('minSalary').value;
        const maxSalaryValue = document.getElementById('maxSalary').value;

        const jobData = {
            title: document.getElementById('jobTitle').value,
            company: document.getElementById('company').value,
            description: document.getElementById('jobDescription').value,
            jobType: document.getElementById('jobType').value, // This will be "FULL_TIME" as a string
            location: document.getElementById('location').value || null,
            minSalary: minSalaryValue ? parseFloat(minSalaryValue) * 1000 : null,
            maxSalary: maxSalaryValue ? parseFloat(maxSalaryValue) * 1000 : null,
            skills: document.getElementById('skills').value || null,
            applicationDeadline: formattedDeadline,
            requirements: null,
            benefits: null,
            experience: null,
            education: null
        };

        console.log('Token:', this.token);
        console.log('Job Data:', JSON.stringify(jobData, null, 2));

        const submitBtn = document.querySelector('#postJobForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(jobData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('Job posted successfully!', 'success');
                this.loadPage('my-jobs');
            } else {
                this.showAlert(data.message || 'Failed to post job', 'error');
            }
        } catch (error) {
            this.showAlert('Network error. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadReceivedApplications() {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

    try {
        const response = await fetch(`${this.baseURL}/applications/recruiter/applications`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const data = await response.json();
        const applications = data.content || [];

        if (!applications.length) {
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-inbox"></i> Applications Received</h1>
                    <p>Review candidates who applied to your jobs</p>
                </div>
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No applications yet</h3>
                    <p>Once candidates apply to your jobs, they'll appear here</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="page-header fade-in">
                <h1><i class="fas fa-inbox"></i> Applications Received</h1>
                <p>Review candidates who applied to your jobs</p>
            </div>
            <div class="applications-list">
                ${applications.map(app => `
                    <div class="application-card fade-in">
                        <div class="application-header">
                            <div>
                                <h3>${app.candidateName}</h3>
                                <p class="company-name"><i class="fas fa-envelope"></i> ${app.candidateEmail}</p>
                            </div>
                            <span class="status-badge status-${app.status.toLowerCase()}">${this.formatStatus(app.status)}</span>
                        </div>
                        <div class="application-meta">
                            <span><i class="fas fa-briefcase"></i> ${app.jobTitle}</span>
                            <span><i class="fas fa-calendar"></i> Applied ${this.formatDate(app.appliedAt)}</span>
                        </div>
                        ${app.coverLetter ? `
                            <div class="cover-letter-preview">
                                <strong><i class="fas fa-file-alt"></i> Application Details:</strong>
                                <p>${this.truncateText(app.coverLetter, 300)}</p>
                            </div>
                        ` : ''}
                        ${app.status !== 'WITHDRAWN' && app.status !== 'ACCEPTED' && app.status !== 'REJECTED' ? `
                            <div class="application-actions">
                                <button onclick="app.updateApplicationStatus(${app.applicationId}, 'SHORTLISTED')" class="btn btn-primary">
                                    <i class="fas fa-star"></i> Shortlist
                                </button>
                                <button onclick="app.updateApplicationStatus(${app.applicationId}, 'ACCEPTED')" class="btn btn-outline" style="color: #10b981; border-color: #10b981;">
                                    <i class="fas fa-check"></i> Accept
                                </button>
                                <button onclick="app.updateApplicationStatus(${app.applicationId}, 'REJECTED')" class="btn btn-outline btn-danger">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = '<div class="card">Error loading applications</div>';
    }
}

    async updateApplicationStatus(applicationId, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this application?`)) {
        return;
    }

    try {
        const response = await fetch(`${this.baseURL}/applications/${applicationId}/status?status=${status}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (response.ok) {
            this.showAlert(`Application ${status.toLowerCase()} successfully`, 'success');
            this.loadReceivedApplications();
        } else {
            this.showAlert('Failed to update application status', 'error');
        }
    } catch (error) {
        this.showAlert('Network error', 'error');
    }
}

    async loadProfile() {
        const content = document.getElementById('dashboardContent');
        
        if (this.user.role === 'CANDIDATE') {
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-user"></i> My Profile</h1>
                    <p>Manage your professional information</p>
                </div>
                <div class="profile-container fade-in">
                    <div class="profile-card">
                        <div class="profile-header">
                            <div class="profile-avatar-large">${this.user.email?.charAt(0).toUpperCase()}</div>
                            <h2>${this.user.name || this.user.email?.split('@')[0]}</h2>
                            <p class="profile-email">${this.user.email}</p>
                        </div>
                        
                        <form id="profileForm" class="profile-form">
                            <h3><i class="fas fa-user-circle"></i> Personal Information</h3>
                            
                            <div class="form-group">
                                <label for="profileName">Full Name</label>
                                <input type="text" id="profileName" class="form-control" value="${this.user.name || ''}" placeholder="Your full name">
                            </div>
                            
                            <div class="form-group">
                                <label for="profilePhone">Phone Number</label>
                                <input type="tel" id="profilePhone" class="form-control" placeholder="+1 (555) 123-4567">
                            </div>
                            
                            <div class="form-group">
                                <label for="profileLocation">Location</label>
                                <input type="text" id="profileLocation" class="form-control" placeholder="City, Country">
                            </div>
                            
                            <h3><i class="fas fa-briefcase"></i> Professional Details</h3>
                            
                            <div class="form-group">
                                <label for="profileBio">Professional Bio</label>
                                <textarea id="profileBio" class="form-control" rows="4" placeholder="Tell employers about yourself..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="profileSkills">Skills</label>
                                <input type="text" id="profileSkills" class="form-control" placeholder="e.g. JavaScript, Python, Project Management">
                                <small class="form-hint">Separate skills with commas</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="profileExperience">Years of Experience</label>
                                <input type="number" id="profileExperience" class="form-control" placeholder="0">
                            </div>
                            
                            <div class="form-group">
                                <label for="profileEducation">Education</label>
                                <textarea id="profileEducation" class="form-control" rows="3" placeholder="Your educational background..."></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary btn-large">
                                    <i class="fas fa-save"></i> Save Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        } else if (this.user.role === 'RECRUITER') {
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-building"></i> Company Profile</h1>
                    <p>Manage your company information</p>
                </div>
                <div class="profile-container fade-in">
                    <div class="profile-card">
                        <div class="profile-header">
                            <div class="profile-avatar-large profile-company">${this.user.email?.charAt(0).toUpperCase()}</div>
                            <h2>${this.user.name || 'Company Name'}</h2>
                            <p class="profile-email">${this.user.email}</p>
                        </div>
                        
                        <form id="profileForm" class="profile-form">
                            <h3><i class="fas fa-building"></i> Company Information</h3>
                            
                            <div class="form-group">
                                <label for="companyName">Company Name</label>
                                <input type="text" id="companyName" class="form-control" value="${this.user.name || ''}" placeholder="Your company name">
                            </div>
                            
                            <div class="form-group">
                                <label for="companyWebsite">Company Website</label>
                                <input type="url" id="companyWebsite" class="form-control" placeholder="https://www.yourcompany.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="companyLocation">Headquarters Location</label>
                                <input type="text" id="companyLocation" class="form-control" placeholder="City, Country">
                            </div>
                            
                            <div class="form-group">
                                <label for="companySize">Company Size</label>
                                <select id="companySize" class="form-control form-select">
                                    <option value="">Select size</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="501-1000">501-1000 employees</option>
                                    <option value="1000+">1000+ employees</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="companyIndustry">Industry</label>
                                <input type="text" id="companyIndustry" class="form-control" placeholder="e.g. Technology, Healthcare, Finance">
                            </div>
                            
                            <div class="form-group">
                                <label for="companyDescription">Company Description</label>
                                <textarea id="companyDescription" class="form-control" rows="5" placeholder="Tell candidates about your company..."></textarea>
                            </div>
                            
                            <h3><i class="fas fa-user-tie"></i> Contact Person</h3>
                            
                            <div class="form-group">
                                <label for="contactName">Contact Name</label>
                                <input type="text" id="contactName" class="form-control" placeholder="HR Manager name">
                            </div>
                            
                            <div class="form-group">
                                <label for="contactPhone">Contact Phone</label>
                                <input type="tel" id="contactPhone" class="form-control" placeholder="+1 (555) 123-4567">
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary btn-large">
                                    <i class="fas fa-save"></i> Save Company Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.showAlert('Profile saved successfully!', 'success');
        });
    }

    formatStatus(status) {
        const statusMap = {
            'PENDING': 'Under Review',
            'REVIEWED': 'Reviewed',
            'SHORTLISTED': 'Shortlisted',
            'INTERVIEW_SCHEDULED': 'Interview Scheduled',
            'ACCEPTED': 'Accepted',
            'REJECTED': 'Rejected',
            'WITHDRAWN': 'Withdrawn'
        };
        return statusMap[status] || status;
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
        if (modalId === 'loginModal') {
            setTimeout(() => this.generateCaptcha(), 100);
        }
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        const alertContainer = document.getElementById(`${modalId}Alert`);
        if (alertContainer) {
            alertContainer.innerHTML = '';
        }
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} fade-in`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        const target = document.querySelector('.dashboard.show') ? 
            document.querySelector('.dashboard-content') : 
            document.querySelector('.main-content');
        
        target.insertBefore(alertDiv, target.firstChild);
        
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    showModalAlert(modalId, message, type = 'info') {
        const alertContainer = document.getElementById(`${modalId}Alert`);
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-${type}">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                    ${message}
                </div>
            `;
        }
    }

    formatJobType(type) {
        return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// Global functions
function showModal(modalId) { app.showModal(modalId); }
function hideModal(modalId) { app.hideModal(modalId); }
function showHome() { app.showHome(); }
function showJobs() {
    if (app.token) {
        app.loadPage('jobs');
    } else {
        app.showModal('loginModal');
    }
}
function logout() { app.logout(); }

const app = new JobPortalApp();