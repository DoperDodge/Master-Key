import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CommentSection from '../components/CommentSection';

function PostDetail({ user }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Post not found');
        return res.json();
      })
      .then(data => setPost(data))
      .catch(() => setError('Post not found'));
  }, [id]);

  if (error) {
    return (
      <div className="empty-state">
        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!post) return <div className="loading">Loading...</div>;

  const images = post.images ? post.images.filter(img => img.url) : [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {images.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--bg-input)',
          }}>
            <img
              src={images[currentImage].url}
              alt={post.title}
              style={{
                width: '100%',
                maxHeight: '520px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    backdropFilter: 'blur(4px)',
                  }}
                >‹</button>
                <button
                  onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    backdropFilter: 'blur(4px)',
                  }}
                >›</button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.75rem',
              justifyContent: 'center',
              overflowX: 'auto',
              padding: '0.25rem 0',
            }}>
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImage(i)}
                  style={{
                    width: '56px',
                    height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    border: i === currentImage ? '2px solid var(--accent)' : '2px solid transparent',
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    flexShrink: 0,
                    opacity: i === currentImage ? 1 : 0.5,
                    transition: 'all var(--transition)',
                  }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
      }}>
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.6rem', fontWeight: 700 }}>{post.title}</h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}>
          <span className="badge">{post.grade}</span>
          <span className="badge">{post.class}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            by <span style={{ color: 'var(--text-secondary)' }}>{post.username}</span>
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>
        {post.description && (
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{post.description}</p>
        )}
      </div>

      <CommentSection postId={id} user={user} />
    </div>
  );
}

export default PostDetail;
