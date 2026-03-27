import { useState, useEffect } from 'react';

function Dashboard({ user }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/posts/mine/all')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(() => {});
  }, [user]);

  if (!user) return <p>Please log in to view your dashboard.</p>;

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

  return (
    <div>
      <h1>My Dashboard</h1>
      {posts.length === 0 ? (
        <p style={{ color: '#888' }}>You haven't uploaded any posts yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map(post => {
            const firstImage = post.images && post.images[0] && post.images[0].url ? post.images[0] : null;
            return (
              <div key={post.id} style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                alignItems: 'center'
              }}>
                {firstImage && (
                  <img src={firstImage.url} alt={post.title} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem' }}>{post.title}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                    {post.grade} - {post.class}
                  </p>
                </div>
                <select
                  value={post.visibility}
                  onChange={e => handleVisibility(post.id, e.target.value)}
                  style={{ padding: '0.4rem' }}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="invisible">Invisible</option>
                </select>
                <button onClick={() => handleDelete(post.id)} style={{
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  padding: '0.4rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
