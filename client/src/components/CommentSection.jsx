import { useState, useEffect } from 'react';

function CommentSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/comments/${postId}`)
      .then(res => res.json())
      .then(data => setComments(data))
      .catch(() => {});
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/comments/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setComments([...comments, data]);
    setBody('');
  };

  return (
    <div style={{
      marginTop: '2.5rem',
      padding: '1.5rem',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
    }}>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 600,
        marginBottom: '1.25rem',
        color: 'var(--text-primary)',
      }}>
        Comments ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
          No comments yet. Be the first to comment!
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {comments.map(c => (
          <div key={c.id} style={{
            padding: '0.85rem 1rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.35rem',
            }}>
              <span style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {c.username[0].toUpperCase()}
              </span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.username}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {new Date(c.created_at).toLocaleDateString()}
              </span>
            </div>
            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              paddingLeft: '2.35rem',
            }}>{c.body}</p>
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} style={{
          marginTop: '1.25rem',
          display: 'flex',
          gap: '0.5rem',
        }}>
          <input
            className="input"
            type="text"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write a comment..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Post</button>
        </form>
      ) : (
        <p style={{
          color: 'var(--text-muted)',
          marginTop: '1.25rem',
          fontSize: '0.9rem',
          textAlign: 'center',
          padding: '0.75rem',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
        }}>
          Log in to leave a comment.
        </p>
      )}
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

export default CommentSection;
