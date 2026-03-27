import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import FilterBar from '../components/FilterBar';

function Home() {
  const [posts, setPosts] = useState([]);
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [keyType, setKeyType] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (grade) params.set('grade', grade);
    if (className) params.set('class', className);
    if (keyType) params.set('key_type', keyType);

    fetch(`/api/posts?${params.toString()}`)
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(() => {});
  }, [grade, className, keyType]);

  return (
    <div>
      <h1 className="page-title">Browse Answer Keys</h1>
      <FilterBar
        grade={grade} setGrade={setGrade}
        className={className} setClassName={setClassName}
        keyType={keyType} setKeyType={setKeyType}
      />
      {posts.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📷</p>
          <p>No posts found. Try adjusting your filters or check back later!</p>
        </div>
      ) : (
        <div className="post-grid">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}

export default Home;
