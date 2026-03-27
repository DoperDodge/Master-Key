import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Dashboard({ user }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/posts/mine/all')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="empty-state">
        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</p>
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  const handleVisibility = async (postId, visibility) => {
    const res = await fetch(`/api/posts/${postId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility })
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts(posts.map(p => p.id === postId ? { ...p, visibility: updated.visibility } : p));
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const visibilityColors = {
    public: { bg: 'rgba(0, 200, 150, 0.1)', color: '#00c896', border: 'rgba(0, 200, 150, 0.3)' },
    unlisted: { bg: 'rgba(255, 165, 2, 0.1)', color: '#ffa502', border: 'rgba(255, 165, 2, 0.3)' },
    invisible: { bg: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: 'rgba(255, 71, 87, 0.3)' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>My Dashboard</h1>
        <Link to="/upload">
          <button className="btn btn-primary">+ New Post</button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</p>
          <p>You haven't uploaded any posts yet.</p>
          <Link to="/upload" style={{ marginTop: '1rem', display: 'inline-block' }}>
            <button className="btn btn-primary">Upload your first post</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {posts.map(post => {
            const firstImage = post.images && post.images[0] && post.images[0].url ? post.images[0] : null;
            const vis = visibilityColors[post.visibility] || visibilityColors.public;

            return (
              <div key={post.id} className="card" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                gap: '1rem',
              }}>
                <Link to={`/post/${post.id}`} style={{ flexShrink: 0 }}>
                  {firstImage ? (
                    <img src={firstImage.url} alt={post.title} style={{
                      width: '80px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                    }} />
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '60px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '1.5rem',
                    }}>📷</div>
                  )}
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.title}
                    </h3>
                  </Link>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <span className="badge">{post.grade}</span>
                    <span className="badge">{post.class}</span>
                  </div>
                </div>

                <div className="dashboard-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <select
                    className="select"
                    value={post.visibility}
                    onChange={e => handleVisibility(post.id, e.target.value)}
                    style={{
                      width: 'auto',
                      padding: '0.4rem 2rem 0.4rem 0.6rem',
                      fontSize: '0.8rem',
                      background: vis.bg,
                      borderColor: vis.border,
                      color: vis.color,
                    }}
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="invisible">Invisible</option>
                  </select>
                  <button onClick={() => handleDelete(post.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .dashboard-actions {
            flex-direction: column;
            align-items: stretch !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
