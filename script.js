const SUPABASE_URL = 'https://nqwtoiozcboyvdnlfjzl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd3RvaW96Y2JveXZkbmxmanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjQzNTYsImV4cCI6MjA4MTM0MDM1Nn0.zRpYtUw487Bkt0rw1K160b6M8D37RDE6v8Xb2EewO9A';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;
let projects = [];
let currentProject = null;
let tasks = [];
let members = [];
let editingProject = null;
let editingTask = null;
let confirmCallback = null;

const el = {
    homeArea: document.getElementById('homeArea'),
    authArea: document.getElementById('authArea'),
    dashboardArea: document.getElementById('dashboardArea'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),
    loginBtn: document.getElementById('loginBtn'),
    signupName: document.getElementById('signupName'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    signupError: document.getElementById('signupError'),
    signupSuccess: document.getElementById('signupSuccess'),
    signupBtn: document.getElementById('signupBtn'),
    navToggle: document.getElementById('navToggle'),
    navMenu: document.getElementById('navMenu'),
    navLinksHome: document.getElementById('navLinksHome'),
    navAuthButtons: document.getElementById('navAuthButtons'),
    navUserMenu: document.getElementById('navUserMenu'),
    navUserName: document.getElementById('navUserName'),
    navAvatar: document.getElementById('navAvatar'),
    sidebar: document.getElementById('sidebar'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    userIdDisplay: document.getElementById('userIdDisplay'),
    pageTitle: document.getElementById('pageTitle'),
    projectsSection: document.getElementById('projectsSection'),
    projectDetailSection: document.getElementById('projectDetailSection'),
    projectsGrid: document.getElementById('projectsGrid'),
    emptyProjects: document.getElementById('emptyProjects'),
    statProjects: document.getElementById('statProjects'),
    statTasks: document.getElementById('statTasks'),
    statMembers: document.getElementById('statMembers'),
    currentProjectName: document.getElementById('currentProjectName'),
    currentProjectDesc: document.getElementById('currentProjectDesc'),
    modalOverlay: document.getElementById('modalOverlay'),
    projectModal: document.getElementById('projectModal'),
    projectModalTitle: document.getElementById('projectModalTitle'),
    projectName: document.getElementById('projectName'),
    projectDesc: document.getElementById('projectDesc'),
    projectColor: document.getElementById('projectColor'),
    projectSubmitBtn: document.getElementById('projectSubmitBtn'),
    taskModal: document.getElementById('taskModal'),
    taskModalTitle: document.getElementById('taskModalTitle'),
    taskTitle: document.getElementById('taskTitle'),
    taskDesc: document.getElementById('taskDesc'),
    taskStatus: document.getElementById('taskStatus'),
    taskPriority: document.getElementById('taskPriority'),
    taskDue: document.getElementById('taskDue'),
    taskAssignee: document.getElementById('taskAssignee'),
    taskSubmitBtn: document.getElementById('taskSubmitBtn'),
    membersModal: document.getElementById('membersModal'),
    inviteUserId: document.getElementById('inviteUserId'),
    inviteError: document.getElementById('inviteError'),
    inviteSuccess: document.getElementById('inviteSuccess'),
    membersList: document.getElementById('membersList'),
    confirmModal: document.getElementById('confirmModal'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmBtn: document.getElementById('confirmBtn'),
    toast: document.getElementById('toast'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    tasksTodo: document.getElementById('tasksTodo'),
    tasksProgress: document.getElementById('tasksProgress'),
    tasksReview: document.getElementById('tasksReview'),
    tasksDone: document.getElementById('tasksDone'),
    countTodo: document.getElementById('countTodo'),
    countProgress: document.getElementById('countProgress'),
    countReview: document.getElementById('countReview'),
    countDone: document.getElementById('countDone')
};

function goHome() {
    if (currentUser) {
        showSection('projects');
        backToProjects();
    } else {
        el.homeArea.style.display = 'block';
        el.authArea.style.display = 'none';
        el.dashboardArea.style.display = 'none';
        el.navLinksHome.style.display = 'flex';
        el.navAuthButtons.style.display = 'flex';
        el.navUserMenu.style.display = 'none';
    }
    closeNavMenu();
    window.scrollTo(0, 0);
}

function showAuth(type = 'login') {
    el.homeArea.style.display = 'none';
    el.authArea.style.display = 'flex';
    el.dashboardArea.style.display = 'none';
    el.navLinksHome.style.display = 'none';
    switchAuthForm(type);
    closeNavMenu();
    window.scrollTo(0, 0);
}

function showDashboard() {
    el.homeArea.style.display = 'none';
    el.authArea.style.display = 'none';
    el.dashboardArea.style.display = 'block';
    el.navLinksHome.style.display = 'none';
    el.navAuthButtons.style.display = 'none';
    el.navUserMenu.style.display = 'flex';
    closeNavMenu();
    loadDashboardData();
}

function switchAuthForm(type) {
    clearErrors();
    el.loginForm.style.display = type === 'login' ? 'block' : 'none';
    el.signupForm.style.display = type === 'signup' ? 'block' : 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = el.loginEmail.value.trim();
    const password = el.loginPassword.value;
    if (!email || !password) { showError('login', 'Preencha todos os campos.'); return; }
    try {
        setButtonLoading(el.loginBtn, true);
        clearErrors();
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { showError('login', translateError(error.message)); return; }
    } catch (err) {
        showError('login', 'Erro inesperado. Tente novamente.');
    } finally {
        setButtonLoading(el.loginBtn, false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = el.signupName.value.trim();
    const email = el.signupEmail.value.trim();
    const password = el.signupPassword.value;
    if (!name || !email || !password) { showError('signup', 'Preencha todos os campos.'); return; }
    if (password.length < 6) { showError('signup', 'Senha deve ter no mínimo 6 caracteres.'); return; }
    try {
        setButtonLoading(el.signupBtn, true);
        clearErrors();
        const { data, error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { full_name: name } }
        });
        if (error) { showError('signup', translateError(error.message)); return; }
        if (data.user?.identities?.length === 0) { showError('signup', 'Este email já está cadastrado.'); return; }
        showSuccess('signup', 'Conta criada! Verifique seu email para confirmar.');
        el.signupName.value = '';
        el.signupEmail.value = '';
        el.signupPassword.value = '';
    } catch (err) {
        showError('signup', 'Erro inesperado. Tente novamente.');
    } finally {
        setButtonLoading(el.signupBtn, false);
    }
}

async function handleLogout() {
    showLoading(true);
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentProfile = null;
    projects = [];
    currentProject = null;
    showLoading(false);
    goHome();
}

async function fetchUserProfile(userId) {
    const { data } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
    return data;
}

function updateUserInterface() {
    if (!currentUser) return;
    let name = 'Usuário';
    let email = currentUser.email || '';
    let avatarUrl = null;
    if (currentProfile) {
        name = currentProfile.full_name || name;
        email = currentProfile.email || email;
        avatarUrl = currentProfile.avatar_url;
    } else if (currentUser.user_metadata?.full_name) {
        name = currentUser.user_metadata.full_name;
    }
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    el.navUserName.textContent = name;
    el.profileName.textContent = name;
    el.profileEmail.textContent = email;
    el.userIdDisplay.textContent = currentUser.id;
    const setAvatar = (elem, url, initials) => {
        if (url) {
            elem.style.backgroundImage = `url(${url})`;
            elem.textContent = '';
        } else {
            elem.style.backgroundImage = '';
            elem.textContent = initials;
        }
    };
    setAvatar(el.navAvatar, avatarUrl, initials);
    setAvatar(el.profileAvatar, avatarUrl, initials);
}

supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        currentProfile = await fetchUserProfile(currentUser.id);
        updateUserInterface();
        showDashboard();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
    }
});

async function checkInitialSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        currentProfile = await fetchUserProfile(currentUser.id);
        updateUserInterface();
        showDashboard();
    } else {
        goHome();
    }
}

async function loadDashboardData() {
    await loadProjects();
    updateStats();
}

async function loadProjects() {
    const { data, error } = await supabaseClient.from('projects').select('*').order('created_at', { ascending: false });
    if (!error) projects = data || [];
    renderProjects();
}

function renderProjects() {
    el.projectsGrid.innerHTML = '';
    if (projects.length === 0) {
        el.emptyProjects.style.display = 'block';
        el.projectsGrid.style.display = 'none';
    } else {
        el.emptyProjects.style.display = 'none';
        el.projectsGrid.style.display = 'grid';
        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.onclick = () => openProject(p);
            card.innerHTML = `
                <div class="project-card-header" style="background: ${p.color || '#6366f1'}"></div>
                <div class="project-card-body">
                    <h4 class="project-card-title">${escapeHtml(p.name)}</h4>
                    <p class="project-card-desc">${escapeHtml(p.description || 'Sem descrição')}</p>
                    <div class="project-card-meta">
                        <span>📅 ${formatDate(p.created_at)}</span>
                    </div>
                </div>
            `;
            el.projectsGrid.appendChild(card);
        });
    }
    el.statProjects.textContent = projects.length;
}

async function updateStats() {
    el.statProjects.textContent = projects.length;
    let totalTasks = 0;
    let totalMembers = new Set();
    for (const p of projects) {
        const { count: taskCount } = await supabaseClient.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', p.id);
        totalTasks += taskCount || 0;
        const { data: membersData } = await supabaseClient.from('project_members').select('user_id').eq('project_id', p.id);
        (membersData || []).forEach(m => totalMembers.add(m.user_id));
    }
    el.statTasks.textContent = totalTasks;
    el.statMembers.textContent = totalMembers.size;
}

function showSection(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    el.projectsSection.style.display = section === 'projects' ? 'block' : 'none';
    el.projectDetailSection.style.display = 'none';
    el.pageTitle.textContent = section === 'projects' ? 'Meus Projetos' : '';
}

async function openProject(project) {
    currentProject = project;
    el.projectsSection.style.display = 'none';
    el.projectDetailSection.style.display = 'block';
    el.currentProjectName.textContent = project.name;
    el.currentProjectDesc.textContent = project.description || 'Sem descrição';
    el.pageTitle.textContent = project.name;
    await loadTasks();
    await loadMembers();
}

function backToProjects() {
    currentProject = null;
    el.projectsSection.style.display = 'block';
    el.projectDetailSection.style.display = 'none';
    el.pageTitle.textContent = 'Meus Projetos';
}

async function loadTasks() {
    if (!currentProject) return;
    const { data } = await supabaseClient.from('tasks').select('*').eq('project_id', currentProject.id).order('position');
    tasks = data || [];
    renderTasks();
}

function renderTasks() {
    const columns = { todo: [], in_progress: [], review: [], done: [] };
    tasks.forEach(t => { if (columns[t.status]) columns[t.status].push(t); });
    el.tasksTodo.innerHTML = columns.todo.map(renderTaskCard).join('');
    el.tasksProgress.innerHTML = columns.in_progress.map(renderTaskCard).join('');
    el.tasksReview.innerHTML = columns.review.map(renderTaskCard).join('');
    el.tasksDone.innerHTML = columns.done.map(renderTaskCard).join('');
    el.countTodo.textContent = columns.todo.length;
    el.countProgress.textContent = columns.in_progress.length;
    el.countReview.textContent = columns.review.length;
    el.countDone.textContent = columns.done.length;
}

function renderTaskCard(task) {
    const priorityClass = `priority-${task.priority}`;
    const priorityLabel = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }[task.priority] || 'Média';
    const dueStr = task.due_date ? formatDate(task.due_date) : '';
    return `
        <div class="task-card" onclick="openEditTaskModal('${task.id}')">
            <div class="task-card-title">${escapeHtml(task.title)}</div>
            <div class="task-card-meta">
                <span class="task-priority ${priorityClass}">${priorityLabel}</span>
                ${dueStr ? `<span class="task-due">📅 ${dueStr}</span>` : ''}
            </div>
        </div>
    `;
}

async function loadMembers() {
    if (!currentProject) return;
    const { data } = await supabaseClient.from('project_members').select('*, profiles:user_id(id, full_name, email, avatar_url)').eq('project_id', currentProject.id);
    members = data || [];
    updateAssigneeSelect();
}

function updateAssigneeSelect() {
    el.taskAssignee.innerHTML = '<option value="">Ninguém</option>';
    members.forEach(m => {
        const name = m.profiles?.full_name || m.profiles?.email || 'Membro';
        el.taskAssignee.innerHTML += `<option value="${m.user_id}">${escapeHtml(name)}</option>`;
    });
}

function openProjectModal() {
    editingProject = null;
    el.projectModalTitle.textContent = 'Novo Projeto';
    el.projectSubmitBtn.textContent = 'Criar Projeto';
    el.projectName.value = '';
    el.projectDesc.value = '';
    el.projectColor.value = '#6366f1';
    openModal(el.projectModal);
}

function openEditProjectModal() {
    if (!currentProject) return;
    editingProject = currentProject;
    el.projectModalTitle.textContent = 'Editar Projeto';
    el.projectSubmitBtn.textContent = 'Salvar';
    el.projectName.value = currentProject.name;
    el.projectDesc.value = currentProject.description || '';
    el.projectColor.value = currentProject.color || '#6366f1';
    openModal(el.projectModal);
}

function closeProjectModal() { closeModal(el.projectModal); }

async function handleProjectSubmit(e) {
    e.preventDefault();
    const name = el.projectName.value.trim();
    const description = el.projectDesc.value.trim();
    const color = el.projectColor.value;
    if (!name) { showToast('Digite o nome do projeto', 'error'); return; }
    showLoading(true);
    try {
        if (editingProject) {
            const { error } = await supabaseClient.from('projects').update({ name, description, color }).eq('id', editingProject.id);
            if (error) throw error;
            currentProject = { ...currentProject, name, description, color };
            el.currentProjectName.textContent = name;
            el.currentProjectDesc.textContent = description || 'Sem descrição';
            el.pageTitle.textContent = name;
            showToast('Projeto atualizado!', 'success');
        } else {
            const { data, error } = await supabaseClient.from('projects').insert({ name, description, color, owner_id: currentUser.id }).select().single();
            if (error) throw error;
            projects.unshift(data);
            showToast('Projeto criado!', 'success');
        }
        closeProjectModal();
        await loadProjects();
    } catch (err) {
        showToast('Erro ao salvar projeto', 'error');
    }
    showLoading(false);
}

function confirmDeleteProject() {
    openConfirm('Excluir Projeto', 'Tem certeza? Todas as tarefas serão excluídas.', async () => {
        showLoading(true);
        const { error } = await supabaseClient.from('projects').delete().eq('id', currentProject.id);
        showLoading(false);
        if (error) { showToast('Erro ao excluir', 'error'); return; }
        showToast('Projeto excluído', 'success');
        backToProjects();
        await loadProjects();
    });
}

function openTaskModal() {
    editingTask = null;
    el.taskModalTitle.textContent = 'Nova Tarefa';
    el.taskSubmitBtn.textContent = 'Criar Tarefa';
    el.taskTitle.value = '';
    el.taskDesc.value = '';
    el.taskStatus.value = 'todo';
    el.taskPriority.value = 'medium';
    el.taskDue.value = '';
    el.taskAssignee.value = '';
    openModal(el.taskModal);
}

function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    editingTask = task;
    el.taskModalTitle.textContent = 'Editar Tarefa';
    el.taskSubmitBtn.textContent = 'Salvar';
    el.taskTitle.value = task.title;
    el.taskDesc.value = task.description || '';
    el.taskStatus.value = task.status;
    el.taskPriority.value = task.priority;
    el.taskDue.value = task.due_date || '';
    el.taskAssignee.value = task.assignee_id || '';
    openModal(el.taskModal);
}

function closeTaskModal() { closeModal(el.taskModal); }

async function handleTaskSubmit(e) {
    e.preventDefault();
    const title = el.taskTitle.value.trim();
    const description = el.taskDesc.value.trim();
    const status = el.taskStatus.value;
    const priority = el.taskPriority.value;
    const due_date = el.taskDue.value || null;
    const assignee_id = el.taskAssignee.value || null;
    if (!title) { showToast('Digite o título da tarefa', 'error'); return; }
    showLoading(true);
    try {
        if (editingTask) {
            const { error } = await supabaseClient.from('tasks').update({ title, description, status, priority, due_date, assignee_id }).eq('id', editingTask.id);
            if (error) throw error;
            showToast('Tarefa atualizada!', 'success');
        } else {
            const { error } = await supabaseClient.from('tasks').insert({ title, description, status, priority, due_date, assignee_id, project_id: currentProject.id, created_by: currentUser.id });
            if (error) throw error;
            showToast('Tarefa criada!', 'success');
        }
        closeTaskModal();
        await loadTasks();
        updateStats();
    } catch (err) {
        showToast('Erro ao salvar tarefa', 'error');
    }
    showLoading(false);
}

async function deleteTask(taskId) {
    openConfirm('Excluir Tarefa', 'Tem certeza que deseja excluir esta tarefa?', async () => {
        showLoading(true);
        await supabaseClient.from('tasks').delete().eq('id', taskId);
        showLoading(false);
        showToast('Tarefa excluída', 'success');
        await loadTasks();
        updateStats();
    });
}

function openMembersModal() {
    el.inviteUserId.value = '';
    el.inviteError.style.display = 'none';
    el.inviteSuccess.style.display = 'none';
    renderMembersList();
    openModal(el.membersModal);
}

function closeMembersModal() { closeModal(el.membersModal); }

function renderMembersList() {
    el.membersList.innerHTML = members.map(m => {
        const profile = m.profiles || {};
        const name = profile.full_name || profile.email || 'Membro';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const avatarStyle = profile.avatar_url ? `background-image: url(${profile.avatar_url})` : '';
        const isOwner = m.role === 'owner';
        return `
            <div class="member-item">
                <div class="member-avatar" style="${avatarStyle}">${profile.avatar_url ? '' : initials}</div>
                <div class="member-info">
                    <div class="member-name">${escapeHtml(name)}</div>
                    <div class="member-role">${m.role}</div>
                </div>
                ${!isOwner && currentProject.owner_id === currentUser.id ? `<button class="btn btn-ghost btn-sm" onclick="removeMember('${m.id}')">Remover</button>` : ''}
            </div>
        `;
    }).join('');
}

async function inviteMember() {
    const userId = el.inviteUserId.value.trim();
    el.inviteError.style.display = 'none';
    el.inviteSuccess.style.display = 'none';
    if (!userId) { el.inviteError.textContent = 'Cole o User ID'; el.inviteError.style.display = 'block'; return; }
    if (members.find(m => m.user_id === userId)) { el.inviteError.textContent = 'Este usuário já é membro'; el.inviteError.style.display = 'block'; return; }
    showLoading(true);
    const { data: profile } = await supabaseClient.from('profiles').select('id').eq('id', userId).single();
    if (!profile) { showLoading(false); el.inviteError.textContent = 'Usuário não encontrado'; el.inviteError.style.display = 'block'; return; }
    const { error } = await supabaseClient.from('project_members').insert({ project_id: currentProject.id, user_id: userId, role: 'member' });
    showLoading(false);
    if (error) { el.inviteError.textContent = 'Erro ao convidar'; el.inviteError.style.display = 'block'; return; }
    el.inviteSuccess.textContent = 'Membro adicionado!';
    el.inviteSuccess.style.display = 'block';
    el.inviteUserId.value = '';
    await loadMembers();
    renderMembersList();
    updateStats();
}

async function removeMember(memberId) {
    showLoading(true);
    await supabaseClient.from('project_members').delete().eq('id', memberId);
    showLoading(false);
    await loadMembers();
    renderMembersList();
    updateStats();
    showToast('Membro removido', 'success');
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecione uma imagem', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Imagem muito grande (máx 5MB)', 'error'); return; }
    showLoading(true);
    try {
        const ext = file.name.split('.').pop();
        const path = `${currentUser.id}/avatar.${ext}`;
        const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(path);
        const avatarUrl = publicUrl + '?t=' + Date.now();
        const { error: updateError } = await supabaseClient.from('profiles').update({ avatar_url: avatarUrl }).eq('id', currentUser.id);
        if (updateError) throw updateError;
        currentProfile = { ...currentProfile, avatar_url: avatarUrl };
        updateUserInterface();
        showToast('Foto atualizada!', 'success');
    } catch (err) {
        showToast('Erro ao enviar foto', 'error');
    }
    showLoading(false);
}

function copyUserId() {
    navigator.clipboard.writeText(currentUser.id);
    showToast('ID copiado!', 'success');
}

function openModal(modal) {
    el.modalOverlay.classList.add('active');
    modal.classList.add('active');
}

function closeModal(modal) {
    el.modalOverlay.classList.remove('active');
    modal.classList.remove('active');
}

function closeAllModals() {
    el.modalOverlay.classList.remove('active');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

function openConfirm(title, message, callback) {
    el.confirmTitle.textContent = title;
    el.confirmMessage.textContent = message;
    confirmCallback = callback;
    openModal(el.confirmModal);
}

function closeConfirmModal() { closeModal(el.confirmModal); confirmCallback = null; }

function confirmAction() {
    closeConfirmModal();
    if (confirmCallback) confirmCallback();
}

function toggleSidebar() {
    el.sidebar.classList.toggle('active');
}

function toggleNavMenu() {
    el.navToggle.classList.toggle('active');
    el.navMenu.classList.toggle('active');
}

function closeNavMenu() {
    el.navToggle.classList.remove('active');
    el.navMenu.classList.remove('active');
}

function translateError(msg) {
    const t = {
        'Invalid login credentials': 'Email ou senha incorretos.',
        'Email not confirmed': 'Confirme seu email antes de fazer login.',
        'User already registered': 'Este email já está cadastrado.',
        'Password should be at least 6 characters': 'Senha deve ter no mínimo 6 caracteres.',
        'Unable to validate email address: invalid format': 'Email inválido.'
    };
    return t[msg] || msg;
}

function showError(form, msg) {
    const elem = form === 'login' ? el.loginError : el.signupError;
    elem.textContent = msg;
    elem.style.display = 'block';
}

function showSuccess(form, msg) {
    if (form === 'signup') { el.signupSuccess.textContent = msg; el.signupSuccess.style.display = 'block'; }
}

function clearErrors() {
    el.loginError.style.display = 'none';
    el.signupError.style.display = 'none';
    el.signupSuccess.style.display = 'none';
}

function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (text) text.style.display = loading ? 'none' : 'inline';
    if (loader) loader.style.display = loading ? 'block' : 'none';
}

function showLoading(show) {
    el.loadingOverlay.classList.toggle('active', show);
}

function showToast(msg, type = '') {
    el.toast.textContent = msg;
    el.toast.className = 'toast active ' + type;
    setTimeout(() => el.toast.classList.remove('active'), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

el.navToggle?.addEventListener('click', toggleNavMenu);
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', closeNavMenu));
document.addEventListener('DOMContentLoaded', checkInitialSession);
