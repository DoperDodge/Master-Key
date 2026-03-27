import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminPanel({ user }) {
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({});

  const GRADE_CLASSES = {
    '9th': ['Algebra'],
    '10th': ['Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'],
    '11th': ['Algebra 2'],
    '12th': [],
  };
  const BASE_KEY_TYPES = ['Homework', 'Classwork', 'Notes', 'Quiz', 'Test', 'Miscellaneous'];

  useEffect(() => {
    if (!user || !user.is_admin) return;
    if (tab === 'posts') {
      fetch('/api/admin/posts').then(r => r.json()).then(setPosts).catch(() => {});
    } else {
      fetch('/api/admin/users').then(r => r.json()).then(setUsers).catch(() => {});
    }
  }, [user, tab]);

  if (!user || !user.is_admin) {
    return (
      <div className="empty-state">
        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚫</p>
        <p>Admin access required.</p>
      </div>
    );
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) setPosts(posts.filter(p => p.id !== postId));
  };

  const handleBan = async (userId, ban) => {
    const action = ban ? 'ban' : 'unban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    const res = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banned: ban })
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(users.map(u => u.id === userId ? { ...u, banned: updated.banned } : u));
    }
  };

  const startEdit = (post) => {
    setEditingPost(post.id);
    setEditForm({
      title: post.title,
      description: post.description || '',
      grade: post.grade,
      class: post.class,
      visibility: post.visibility,
      key_type: post.key_type || '',
    });
  };

  const saveEdit = async (postId) => {
    const res = await fetch(`/api/admin/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts(posts.map(p => p.id === postId ? { ...p, ...updated } : p));
      setEditingPost(null);
    }
  };

  const tabStyle = (active) => ({
    padding: '0.6rem 1.2rem',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: active ? 'none' : '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all var(--transition)',
  });

  return (
    <div>
      <h1 className="page-title">Admin Panel</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle(tab === 'posts')} onClick={() => setTab('posts')}>Posts ({posts.length})</button>
        <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>Users ({users.length})</button>
      </div>

      {tab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {posts.map(post => {
            const firstImage = post.images && post.images[0] && post.images[0].url ? post.images[0] : null;
            const isEditing = editingPost === post.id;

            return (
              <div key={post.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Link to={`/post/${post.id}`} style={{ flexShrink: 0 }}>
                    {firstImage ? (
                      <img src={firstImage.url} alt={post.title} style={{
                        width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)',
                      }} />
                    ) : (
                      <div style={{
                        width: '80px', height: '60px', background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.5rem',
                      }}>📷</div>
                    )}
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        style={{ marginBottom: '0.5rem' }} />
                    ) : (
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{post.title}</h3>
                    )}
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      by {post.username} | {post.grade} - {post.class}{post.key_type ? ` - ${post.key_type}` : ''} | {post.visibility}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {isEditing ? (
                      <>
                        <button className="btn btn-success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => saveEdit(post.id)}>Save</button>
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEditingPost(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => startEdit(post)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleDeletePost(post.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label className="label">Description</label>
                      <textarea className="textarea" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                    </div>
                    <div>
                      <label className="label">Grade</label>
                      <select className="select" value={editForm.grade} onChange={e => {
                        const g = e.target.value;
                        const classes = GRADE_CLASSES[g] || [];
                        setEditForm({ ...editForm, grade: g, class: classes[0] || editForm.class });
                      }}>
                        {Object.keys(GRADE_CLASSES).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Class</label>
                      <select className="select" value={editForm.class} onChange={e => {
                        const c = e.target.value;
                        setEditForm({ ...editForm, class: c, key_type: editForm.key_type === 'Lab' && c !== 'Chemistry' ? '' : editForm.key_type });
                      }}>
                        {(GRADE_CLASSES[editForm.grade] || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select className="select" value={editForm.key_type} onChange={e => setEditForm({ ...editForm, key_type: e.target.value })}>
                        <option value="">None</option>
                        {[...BASE_KEY_TYPES, ...(editForm.class === 'Chemistry' ? ['Lab'] : [])].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Visibility</label>
                      <select className="select" value={editForm.visibility} onChange={e => setEditForm({ ...editForm, visibility: e.target.value })}>
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="invisible">Invisible</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {users.map(u => (
            <div key={u.id} className="card" style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              gap: '1rem',
              opacity: u.banned ? 0.6 : 1,
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: u.is_admin ? 'rgba(108, 92, 231, 0.2)' : 'var(--bg-hover)',
                color: u.is_admin ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 600, flexShrink: 0,
              }}>
                {u.username[0].toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{u.username}</span>
                  {u.is_admin && <span className="badge" style={{ background: 'rgba(108, 92, 231, 0.2)', color: 'var(--accent)' }}>Admin</span>}
                  {u.banned && <span className="badge" style={{ background: 'rgba(255, 71, 87, 0.15)', color: 'var(--danger)' }}>Banned</span>}
                </div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>

              {!u.is_admin && (
                <button
                  className={u.banned ? 'btn btn-success' : 'btn btn-danger'}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => handleBan(u.id, !u.banned)}
                >
                  {u.banned ? 'Unban' : 'Ban'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
