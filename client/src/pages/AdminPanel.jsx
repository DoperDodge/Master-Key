import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminPanel({ user }) {
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [reports, setReports] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editMsgBody, setEditMsgBody] = useState('');

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
    } else if (tab === 'users') {
      fetch('/api/admin/users').then(r => r.json()).then(setUsers).catch(() => {});
    } else if (tab === 'reports') {
      fetch('/api/admin/reports').then(r => r.json()).then(setReports).catch(() => {});
    } else if (tab === 'chats') {
      fetch('/api/admin/conversations').then(r => r.json()).then(setConversations).catch(() => {});
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

  const resolveReport = async (reportId) => {
    const res = await fetch(`/api/admin/reports/${reportId}/resolve`, { method: 'PATCH' });
    if (res.ok) {
      setReports(reports.map(r => r.id === reportId ? { ...r, resolved: true } : r));
    }
  };

  const openChat = async (convId) => {
    setActiveChat(convId);
    const res = await fetch(`/api/admin/conversations/${convId}`);
    const data = await res.json();
    setChatInfo(data.conversation);
    setChatMessages(data.messages);
  };

  const editMessage = async (msgId) => {
    const res = await fetch(`/api/admin/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editMsgBody })
    });
    if (res.ok) {
      setChatMessages(chatMessages.map(m => m.id === msgId ? { ...m, body: editMsgBody, edited: true } : m));
      setEditingMsg(null);
      setEditMsgBody('');
    }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    const res = await fetch(`/api/admin/messages/${msgId}`, { method: 'DELETE' });
    if (res.ok) setChatMessages(chatMessages.filter(m => m.id !== msgId));
  };

  const deleteConversation = async (convId) => {
    if (!window.confirm('Delete this entire conversation?')) return;
    const res = await fetch(`/api/admin/conversations/${convId}`, { method: 'DELETE' });
    if (res.ok) {
      setConversations(conversations.filter(c => c.id !== convId));
      if (activeChat === convId) {
        setActiveChat(null);
        setChatMessages([]);
        setChatInfo(null);
      }
    }
  };

  const getConvName = (conv) => {
    if (conv.name) return conv.name;
    if (conv.members) return conv.members.map(m => m.username).join(', ');
    return 'Chat';
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

  const unresolvedCount = reports.filter(r => !r.resolved).length;

  return (
    <div>
      <h1 className="page-title">Admin Panel</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button style={tabStyle(tab === 'posts')} onClick={() => setTab('posts')}>Posts</button>
        <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>Users</button>
        <button style={{ ...tabStyle(tab === 'reports'), display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setTab('reports')}>
          Reports
          {unresolvedCount > 0 && (
            <span style={{
              background: tab === 'reports' ? 'rgba(255,255,255,0.3)' : 'var(--danger)', color: '#fff',
              fontSize: '0.65rem', borderRadius: '10px', padding: '0.1rem 0.4rem', fontWeight: 700,
            }}>{unresolvedCount}</span>
          )}
        </button>
        <button style={tabStyle(tab === 'chats')} onClick={() => setTab('chats')}>Chats</button>
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
          {posts.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No posts yet.</p>}
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

      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reports.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No reports.</p>}
          {reports.map(r => (
            <div key={r.id} className="card" style={{
              padding: '1rem 1.25rem',
              opacity: r.resolved ? 0.5 : 1,
              borderLeft: r.resolved ? '3px solid var(--text-muted)' : '3px solid var(--danger)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{
                      background: r.report_type === 'post' ? 'rgba(108, 92, 231, 0.15)' : r.report_type === 'message' ? 'rgba(0, 200, 150, 0.12)' : 'rgba(255, 71, 87, 0.15)',
                      color: r.report_type === 'post' ? 'var(--accent)' : r.report_type === 'message' ? '#00c896' : 'var(--danger)',
                    }}>{r.report_type}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      ID: {r.target_id}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      by {r.reporter_username || 'Unknown'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                    {r.resolved && <span className="badge" style={{ background: 'rgba(0, 200, 150, 0.12)', color: '#00c896' }}>Resolved</span>}
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{r.reason}</p>
                </div>
                {!r.resolved && (
                  <button className="btn btn-success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flexShrink: 0 }}
                    onClick={() => resolveReport(r.id)}>Resolve</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'chats' && (
        <div style={{ display: 'flex', gap: '1rem', minHeight: '400px' }}>
          <div style={{
            width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', overflow: 'hidden',
          }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>All Conversations</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map(conv => (
                <div key={conv.id} onClick={() => openChat(conv.id)} style={{
                  padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: activeChat === conv.id ? 'var(--bg-hover)' : 'transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getConvName(conv)}</span>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <span className="badge" style={{ fontSize: '0.6rem' }}>{conv.type}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} style={{
                        background: 'none', border: 'none', color: 'var(--danger)',
                        cursor: 'pointer', fontSize: '0.8rem', padding: '0 0.2rem',
                      }}>×</button>
                    </div>
                  </div>
                  {conv.last_message && (
                    <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message.username}: {conv.last_message.body}
                    </p>
                  )}
                </div>
              ))}
              {conversations.length === 0 && <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No conversations.</p>}
            </div>
          </div>

          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', overflow: 'hidden',
          }}>
            {activeChat && chatInfo ? (
              <>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{getConvName(chatInfo)}</h3>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {chatInfo.members?.length} members - {chatInfo.type}
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {chatMessages.map(msg => (
                    <div key={msg.id} style={{
                      padding: '0.5rem 0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--accent)' }}>{msg.username}</span>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                          <button onClick={() => { setEditingMsg(msg.id); setEditMsgBody(msg.body); }} style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '0.7rem', padding: '0 0.2rem',
                          }}>Edit</button>
                          <button onClick={() => deleteMessage(msg.id)} style={{
                            background: 'none', border: 'none', color: 'var(--danger)',
                            cursor: 'pointer', fontSize: '0.7rem', padding: '0 0.2rem',
                          }}>Del</button>
                        </div>
                      </div>
                      {editingMsg === msg.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input className="input" value={editMsgBody} onChange={e => setEditMsgBody(e.target.value)}
                            style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }} />
                          <button className="btn btn-success" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => editMessage(msg.id)}>Save</button>
                          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setEditingMsg(null)}>Cancel</button>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {msg.body}
                          {msg.edited && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>(edited)</span>}
                        </p>
                      )}
                    </div>
                  ))}
                  {chatMessages.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No messages.</p>}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Select a conversation to view</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
