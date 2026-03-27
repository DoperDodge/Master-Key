import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import FilterBar from '../components/FilterBar';

function Home() {
  const [posts, setPosts] = useState([]);
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (grade) params.set('grade', grade);
    if (className) params.set('class', className);

    fetch(`/api/posts?${params.toString()}`)
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(() => {});
  }, [grade, className]);

  return (
    <div>
      <h1>Browse Photos</h1>
      <FilterBar grade={grade} setGrade={setGrade} className={className} setClassName={setClassName} />
      {posts.length === 0 ? (
        <p style={{ color: '#888' }}>No posts found.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}

export default Home;
