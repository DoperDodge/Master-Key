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

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!post) return <p>Loading...</p>;

  const images = post.images ? post.images.filter(img => img.url) : [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {images.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <img
            src={images[currentImage].url}
            alt={post.title}
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px' }}
          />
          {images.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImage(i)}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: i === currentImage ? '2px solid #3498db' : '1px solid #ddd',
                    borderRadius: '4px',
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <h1 style={{ marginBottom: '0.25rem' }}>{post.title}</h1>
      <p style={{ color: '#666', margin: '0 0 1rem' }}>
        {post.grade} - {post.class} | by {post.username} | {new Date(post.created_at).toLocaleDateString()}
      </p>
      {post.description && <p>{post.description}</p>}
      <CommentSection postId={id} user={user} />
    </div>
  );
}

export default PostDetail;
