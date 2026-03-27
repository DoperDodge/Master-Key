import { Link } from 'react-router-dom';

function PostCard({ post }) {
  const firstImage = post.images && post.images[0] && post.images[0].url ? post.images[0] : null;
  const imageCount = post.images ? post.images.filter(img => img.url).length : 0;

  return (
    <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ cursor: 'pointer' }}>
        <div style={{ position: 'relative', paddingTop: '65%', background: 'var(--bg-input)' }}>
          {firstImage && (
            <img
              src={firstImage.url}
              alt={post.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          {imageCount > 1 && (
            <span style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '20px',
              backdropFilter: 'blur(4px)',
            }}>
              {imageCount} photos
            </span>
          )}
        </div>
        <div style={{ padding: '1rem 1.15rem' }}>
          <h3 style={{
            margin: '0 0 0.5rem',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}>
            {post.title}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge">{post.grade}</span>
              <span className="badge">{post.class}</span>
              {post.key_type && (
                <span className="badge" style={{ background: 'rgba(0, 200, 150, 0.12)', color: '#00c896' }}>
                  {post.key_type}
                </span>
              )}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              by {post.username}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PostCard;
