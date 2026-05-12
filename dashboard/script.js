const STORAGE_PASSWORD = 'dfrCmsPassword';
const STORAGE_CONTENT = 'dfrCmsLatestContent';
const STORAGE_REFRESH = 'dfrCmsRefresh';

const state = {
  password: localStorage.getItem(STORAGE_PASSWORD) || '',
  content: null,
  pages: [],
  groups: [],
  activeGroup: '',
  activePage: '/'
};

const els = {
  groupNav: document.getElementById('groupNav'),
  loginPanel: document.getElementById('loginPanel'),
  editorPanel: document.getElementById('editorPanel'),
  passwordInput: document.getElementById('passwordInput'),
  loginButton: document.getElementById('loginButton'),
  logoutButton: document.getElementById('logoutButton'),
  reloadButton: document.getElementById('reloadButton'),
  saveButton: document.getElementById('saveButton'),
  refreshPreviewButton: document.getElementById('refreshPreviewButton'),
  editorForm: document.getElementById('editorForm'),
  updatedAt: document.getElementById('updatedAt'),
  status: document.getElementById('status'),
  pageSelect: document.getElementById('pageSelect'),
  pageSummary: document.getElementById('pageSummary'),
  previewFrame: document.getElementById('previewFrame')
};

function normalizePath(value) {
  const clean = String(value || '/').split('?')[0].split('#')[0] || '/';
  return clean.endsWith('/') ? clean : `${clean}/`;
}

function setStatus(message, type = '') {
  els.status.textContent = message || '';
  els.status.className = `status ${type}`.trim();
}

function formatDate(value) {
  if (!value) return '未保存: 初期コンテンツを表示中';
  return `最終保存: ${new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))}`;
}

function fieldValue(field) {
  return field.value == null ? '' : String(field.value);
}

function collectMeta(content) {
  const pageMap = new Map();
  content.fields.forEach((field) => {
    if (!field.page) return;
    const path = normalizePath(field.page);
    if (!pageMap.has(path)) {
      pageMap.set(path, {
        path,
        title: field.pageTitle || path,
        count: 0
      });
    }
    pageMap.get(path).count += 1;
  });

  state.pages = Array.from(pageMap.values()).sort((a, b) => {
    if (a.path === '/') return -1;
    if (b.path === '/') return 1;
    return a.title.localeCompare(b.title, 'ja');
  });
  state.groups = Array.from(new Set(content.fields.map((field) => field.group || 'その他')));
  if (!state.activeGroup || !state.groups.includes(state.activeGroup)) {
    state.activeGroup = state.groups[0] || '';
  }
  if (!state.pages.some((page) => page.path === state.activePage)) {
    state.activePage = state.pages[0]?.path || '/';
  }
}

function renderGroups() {
  els.groupNav.innerHTML = '';
  state.groups.forEach((group) => {
    const count = state.content.fields.filter((field) => (field.group || 'その他') === group).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = group === state.activeGroup ? 'active' : '';
    button.textContent = `${group} (${count})`;
    button.addEventListener('click', () => {
      state.activeGroup = group;
      render();
    });
    els.groupNav.appendChild(button);
  });
}

function renderPages() {
  els.pageSelect.innerHTML = '';
  state.pages.forEach((page) => {
    const option = document.createElement('option');
    option.value = page.path;
    option.textContent = `${page.path === '/' ? 'トップページ' : page.title} (${page.count})`;
    option.selected = page.path === state.activePage;
    els.pageSelect.appendChild(option);
  });
  const active = state.pages.find((page) => page.path === state.activePage);
  els.pageSummary.textContent = active
    ? `${active.title} / ${active.path} / 編集項目 ${active.count}件`
    : '';
}

function fieldMatches(field) {
  const group = field.group || 'その他';
  if (group !== state.activeGroup) return false;
  if (!field.page) return true;
  return normalizePath(field.page) === state.activePage;
}

function inputForField(field) {
  const id = `field-${field.id}`;
  let input;
  if (field.type === 'textarea' || field.type === 'html') {
    input = document.createElement('textarea');
    input.rows = field.type === 'html' ? 8 : 4;
  } else if (field.type === 'image') {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-field';
    input = document.createElement('input');
    input.type = 'url';
    input.placeholder = 'https://...';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', () => uploadImage(fileInput, input, field));
    wrapper.append(input, fileInput);
    input.id = id;
    input.name = field.id;
    input.value = fieldValue(field);
    input.dataset.fieldId = field.id;
    return wrapper;
  } else {
    input = document.createElement('input');
    input.type = field.type === 'url' ? 'url' : 'text';
  }

  input.id = id;
  input.name = field.id;
  input.value = fieldValue(field);
  input.dataset.fieldId = field.id;
  input.addEventListener('input', () => {
    field.value = input.value;
    pushLocalPreview();
  });
  return input;
}

function renderFields() {
  const fields = state.content.fields.filter(fieldMatches);
  els.editorForm.innerHTML = '';

  if (!fields.length) {
    const empty = document.createElement('div');
    empty.className = 'field-card empty';
    empty.innerHTML = '<h3>この条件に一致する編集項目がありません</h3><p>左のグループ、またはページを切り替えてください。</p>';
    els.editorForm.appendChild(empty);
    return;
  }

  fields.forEach((field) => {
    const card = document.createElement('div');
    card.className = 'field-card';

    const label = document.createElement('label');
    label.htmlFor = `field-${field.id}`;
    label.textContent = field.label || field.id;

    const input = inputForField(field);
    const hint = document.createElement('small');
    hint.textContent = `${field.page || '全ページ'} / ${field.selector || ''}`;

    card.append(label, input, hint);
    els.editorForm.appendChild(card);
  });
}

function previewUrl() {
  const path = normalizePath(state.activePage);
  return `${path}?cmsPreview=${Date.now()}`;
}

function refreshPreview() {
  els.previewFrame.src = previewUrl();
}

function pushLocalPreview() {
  if (!state.content) return;
  const snapshot = {
    ...state.content,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_CONTENT, JSON.stringify(snapshot));
  localStorage.setItem(STORAGE_REFRESH, String(Date.now()));
}

async function loadContent() {
  setStatus('CMSデータを読み込んでいます...');
  const response = await fetch(`/api/content?ts=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('CMSデータを読み込めませんでした');
  state.content = await response.json();
  collectMeta(state.content);
  render();
  pushLocalPreview();
  setStatus('読み込みました', 'good');
}

function updateStateFromForm() {
  const byId = new Map(state.content.fields.map((field) => [field.id, field]));
  els.editorForm.querySelectorAll('[data-field-id]').forEach((input) => {
    const field = byId.get(input.dataset.fieldId);
    if (field) field.value = input.value;
  });
}

async function saveContent() {
  updateStateFromForm();
  setStatus('保存しています...');
  els.saveButton.disabled = true;
  try {
    const response = await fetch('/api/content', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': state.password
      },
      body: JSON.stringify(state.content)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || '保存に失敗しました');
    state.content = payload;
    collectMeta(state.content);
    render();
    pushLocalPreview();
    refreshPreview();
    setStatus('保存しました。公開ページに反映済みです。', 'good');
  } catch (error) {
    setStatus(error.message, 'bad');
  } finally {
    els.saveButton.disabled = false;
  }
}

async function uploadImage(fileInput, textInput, field) {
  const file = fileInput.files?.[0];
  if (!file) return;
  setStatus('画像をアップロードしています...');
  try {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': state.password
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        data
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || '画像アップロードに失敗しました');
    textInput.value = payload.url;
    field.value = payload.url;
    pushLocalPreview();
    setStatus('画像をアップロードしました。保存して公開反映してください。', 'good');
  } catch (error) {
    setStatus(error.message, 'bad');
  }
}

function showLoggedIn() {
  els.loginPanel.hidden = true;
  els.editorPanel.hidden = false;
  els.logoutButton.hidden = false;
}

function showLoggedOut() {
  els.loginPanel.hidden = false;
  els.editorPanel.hidden = true;
  els.logoutButton.hidden = true;
  els.passwordInput.value = '';
}

function render() {
  if (!state.content) return;
  els.updatedAt.textContent = formatDate(state.content.updatedAt);
  renderGroups();
  renderPages();
  renderFields();
  refreshPreview();
}

function login() {
  const password = els.passwordInput.value.trim();
  if (!password) {
    setStatus('管理パスワードを入力してください', 'bad');
    return;
  }
  state.password = password;
  localStorage.setItem(STORAGE_PASSWORD, password);
  showLoggedIn();
  loadContent().catch((error) => setStatus(error.message, 'bad'));
}

els.loginButton.addEventListener('click', login);
els.passwordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') login();
});
els.logoutButton.addEventListener('click', () => {
  state.password = '';
  localStorage.removeItem(STORAGE_PASSWORD);
  showLoggedOut();
});
els.reloadButton.addEventListener('click', () => loadContent().catch((error) => setStatus(error.message, 'bad')));
els.saveButton.addEventListener('click', saveContent);
els.refreshPreviewButton.addEventListener('click', refreshPreview);
els.pageSelect.addEventListener('change', () => {
  updateStateFromForm();
  state.activePage = normalizePath(els.pageSelect.value);
  pushLocalPreview();
  render();
});
els.editorForm.addEventListener('input', () => {
  updateStateFromForm();
  pushLocalPreview();
});

if (state.password) {
  showLoggedIn();
  loadContent().catch((error) => setStatus(error.message, 'bad'));
} else {
  showLoggedOut();
}
