// ローカル環境とVercel環境でAPIのURLを自動切り替えする
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api';

// 現在のフィルター状態
let currentSort = 'new';
let currentCategory = '';

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
  fetchPosts();
  setupModal();
  setupFilters();
});

// --- 投稿一覧の取得・表示 ---
async function fetchPosts() {
  const postsEl = document.getElementById('posts');
  postsEl.innerHTML = '<p class="loading">読み込み中…</p>';

  const params = new URLSearchParams({ sort: currentSort });
  if (currentCategory) params.set('category', currentCategory);

  try {
    const res = await fetch(`${API_BASE}/posts?${params}`);
    const { posts } = await res.json();

    if (posts.length === 0) {
      postsEl.innerHTML = '<p class="empty">まだ投稿がありません。最初の一言をどうぞ 😶‍🌫️</p>';
      return;
    }
    postsEl.innerHTML = posts.map(renderPostCard).join('');
  } catch {
    postsEl.innerHTML = '<p class="empty">読み込みに失敗しました。再読み込みしてください。</p>';
  }
}

// --- 投稿カードのHTMLを生成する ---
function renderPostCard(post) {
  // 共感済みかどうかをローカルストレージで管理する
  const sympathized = getSympathized(post.id);
  const date = new Date(post.created_at).toLocaleDateString('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `
    <div class="post-card">
      <span class="post-category cat-${post.category}">${post.category}</span>
      <p class="post-text">${escapeHtml(post.text)}</p>
      <div class="post-actions">
        <button
          class="action-btn ${sympathized ? 'sympathized' : ''}"
          onclick="handleSympathy('${post.id}', this)"
          ${sympathized ? 'disabled' : ''}
        >
          😔 共感 ${post.sympathy_count}
        </button>
        <button class="action-btn" onclick="handleReport('${post.id}', this)">
          🚩 報告
        </button>
        <button class="action-btn" onclick="toggleComments('${post.id}', this)">
          💬 コメント
        </button>
        <span class="post-date">${date}</span>
      </div>
      <div class="comments-section" id="comments-${post.id}" style="display:none;">
        <div class="comments-list" id="comments-list-${post.id}"></div>
        <div class="comment-form">
          <textarea class="comment-input" id="comment-input-${post.id}" placeholder="コメントを入力…" maxlength="200"></textarea>
          <button class="btn-comment-submit" onclick="handleCommentSubmit('${post.id}')">送信</button>
        </div>
      </div>
    </div>
  `;
}

// --- 共感ボタンの処理 ---
async function handleSympathy(postId, btn) {
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/sympathy`, { method: 'POST' });
    if (!res.ok) throw new Error();

    // ローカルストレージに共感済みとして保存して再表示
    saveSympathized(postId);
    fetchPosts();
  } catch {
    btn.disabled = false;
    alert('共感の送信に失敗しました');
  }
}

// --- 報告ボタンの処理 ---
async function handleReport(postId, btn) {
  if (!confirm('この投稿を報告しますか？')) return;
  btn.disabled = true;
  try {
    await fetch(`${API_BASE}/posts/${postId}/report`, { method: 'POST' });
    btn.textContent = '🚩 報告済み';
  } catch {
    btn.disabled = false;
    alert('報告の送信に失敗しました');
  }
}

// --- 投稿モーダルの制御 ---
function setupModal() {
  const overlay = document.getElementById('modalOverlay');
  const textarea = document.getElementById('postText');
  const charCount = document.getElementById('charCount');

  document.getElementById('openModal').addEventListener('click', () => {
    overlay.classList.add('open');
    textarea.focus();
  });

  document.getElementById('closeModal').addEventListener('click', closeModal);

  // モーダル外クリックで閉じる
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // 文字数カウントのリアルタイム更新
  textarea.addEventListener('input', () => {
    charCount.textContent = textarea.value.length;
  });

  document.getElementById('submitPost').addEventListener('click', handleSubmit);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('postText').value = '';
  document.getElementById('category').value = '';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('errorMsg').textContent = '';
}

// --- 投稿の送信 ---
async function handleSubmit() {
  const text = document.getElementById('postText').value.trim();
  const category = document.getElementById('category').value;
  const errorMsg = document.getElementById('errorMsg');
  const submitBtn = document.getElementById('submitPost');

  // フロントエンド側のバリデーション
  if (!category) { errorMsg.textContent = 'カテゴリを選択してください'; return; }
  if (!text) { errorMsg.textContent = 'もやもやを入力してください'; return; }
  errorMsg.textContent = '';

  submitBtn.disabled = true;
  submitBtn.textContent = '送信中…';

  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, category }),
    });
    if (!res.ok) throw new Error();

    closeModal();
    fetchPosts();
  } catch {
    errorMsg.textContent = '投稿に失敗しました。もう一度試してください。';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '投稿する';
  }
}

// --- フィルター（ソート・カテゴリ）の制御 ---
function setupFilters() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      fetchPosts();
    });
  });

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      fetchPosts();
    });
  });
}

// --- ローカルストレージで共感済みを管理する ---
function getSympathized(postId) {
  const list = JSON.parse(localStorage.getItem('sympathized') || '[]');
  return list.includes(postId);
}

function saveSympathized(postId) {
  const list = JSON.parse(localStorage.getItem('sympathized') || '[]');
  if (!list.includes(postId)) {
    list.push(postId);
    localStorage.setItem('sympathized', JSON.stringify(list));
  }
}

// --- コメントの表示・非表示を切り替える ---
async function toggleComments(postId, btn) {
  const section = document.getElementById(`comments-${postId}`);
  const isOpen = section.style.display !== 'none';

  if (isOpen) {
    section.style.display = 'none';
    btn.textContent = '💬 コメント';
    return;
  }

  section.style.display = 'block';
  btn.textContent = '💬 閉じる';
  await fetchComments(postId);
}

// --- コメント一覧を取得して表示する ---
async function fetchComments(postId) {
  const listEl = document.getElementById(`comments-list-${postId}`);
  listEl.innerHTML = '<p class="loading">読み込み中…</p>';

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
    const comments = await res.json();

    if (comments.length === 0) {
      listEl.innerHTML = '<p class="empty-comment">まだコメントがありません</p>';
      return;
    }

    listEl.innerHTML = comments.map(c => `
      <div class="comment">
        <p class="comment-text">${escapeHtml(c.text)}</p>
        <span class="comment-date">${new Date(c.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `).join('');
  } catch {
    listEl.innerHTML = '<p class="empty-comment">読み込みに失敗しました</p>';
  }
}

// --- コメントを投稿する ---
async function handleCommentSubmit(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();

  if (!text) return;

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error();

    input.value = '';
    await fetchComments(postId);
  } catch {
    alert('コメントの送信に失敗しました');
  }
}

// --- XSS対策：ユーザー入力をHTMLエスケープする ---
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
