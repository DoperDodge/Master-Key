import { Link } from 'react-router-dom';

function PostCard({ post }) {
  const firstImage = post.images && post.images[0] && post.images[0].url ? post.images[0] : null;

  return (
    <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'transform 0.2s',
        cursor: 'pointer'
      }}>
        {firstImage && (
          <img
            src={firstImage.url}
            alt={post.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          />
        )}
        <div style={{ padding: '0.75rem' }}>
          <h3 style={{ margin: '0 0 0.25rem' }}>{post.title}</h3>
          <p style={{ margin: '0', color: '#666', fontSize: '0.875rem' }}>
            {post.grade} - {post.class} | by {post.username}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default PostCard;
