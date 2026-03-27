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
    <div style={{ marginTop: '2rem' }}>
      <h3>Comments</h3>
      {comments.length === 0 && <p style={{ color: '#888' }}>No comments yet.</p>}
      {comments.map(c => (
        <div key={c.id} style={{
          padding: '0.75rem',
          borderBottom: '1px solid #eee'
        }}>
          <strong>{c.username}</strong>
          <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
            {new Date(c.created_at).toLocaleString()}
          </span>
          <p style={{ margin: '0.25rem 0 0' }}>{c.body}</p>
        </div>
      ))}
      {user ? (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write a comment..."
            style={{ flex: 1, padding: '0.5rem' }}
          />
          <button type="submit" style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Post
          </button>
        </form>
      ) : (
        <p style={{ color: '#888', marginTop: '1rem' }}>Log in to leave a comment.</p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default CommentSection;
