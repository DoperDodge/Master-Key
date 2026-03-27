import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Upload({ user }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('10th');
  const [className, setClassName] = useState('Bible');
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <p>Please log in to upload photos.</p>;

  const classes = ['Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!files || files.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('grade', grade);
    formData.append('class', className);
    for (const file of files) {
      formData.append('images', file);
    }

    const res = await fetch('/api/posts', { method: 'POST', body: formData });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }
    navigate('/dashboard');
  };

  const inputStyle = { width: '100%', padding: '0.5rem', marginBottom: '1rem', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1>Upload Photos</h1>
      <form onSubmit={handleSubmit}>
        <label>Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />

        <label>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={inputStyle} />

        <label>Grade</label>
        <select value={grade} onChange={e => setGrade(e.target.value)} style={inputStyle}>
          <option value="10th">10th</option>
        </select>

        <label>Class</label>
        <select value={className} onChange={e => setClassName(e.target.value)} style={inputStyle}>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Images</label>
        <input type="file" accept="image/*" multiple onChange={e => setFiles(e.target.files)} style={inputStyle} />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#2ecc71',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}>
          {submitting ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}

export default Upload;
