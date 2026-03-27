import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GRADE_CLASSES = {
  '9th': ['Algebra'],
  '10th': ['Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'],
  '11th': ['Algebra 2'],
  '12th': [],
};

const BASE_KEY_TYPES = ['Homework', 'Classwork', 'Notes', 'Quiz', 'Test', 'Miscellaneous'];

function Upload({ user }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('10th');
  const [className, setClassName] = useState('Bible');
  const [keyType, setKeyType] = useState('Homework');
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="empty-state">
        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</p>
        <p>Please log in to upload answer keys.</p>
      </div>
    );
  }

  const availableClasses = GRADE_CLASSES[grade] || [];
  const keyTypes = className === 'Chemistry'
    ? [...BASE_KEY_TYPES, 'Lab']
    : BASE_KEY_TYPES;

  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    const classes = GRADE_CLASSES[newGrade] || [];
    if (classes.length > 0) {
      setClassName(classes[0]);
      // Reset key type if Lab was selected but new class isn't Chemistry
      if (keyType === 'Lab' && classes[0] !== 'Chemistry') {
        setKeyType('Homework');
      }
    } else {
      setClassName('');
    }
  };

  const handleClassChange = (newClass) => {
    setClassName(newClass);
    if (keyType === 'Lab' && newClass !== 'Chemistry') {
      setKeyType('Homework');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!className) {
      setError('Please select a class.');
      return;
    }
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
    formData.append('key_type', keyType);
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

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h1 className="page-title">Upload Answer Key</h1>
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Give your post a title" />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a description (optional)" rows={3} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Grade</label>
              <select className="select" value={grade} onChange={e => handleGradeChange(e.target.value)}>
                {Object.keys(GRADE_CLASSES).map(g => (
                  <option key={g} value={g} disabled={GRADE_CLASSES[g].length === 0}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Class</label>
              <select className="select" value={className} onChange={e => handleClassChange(e.target.value)}>
                {availableClasses.length === 0 && <option value="">No classes available</option>}
                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Answer Key Type</label>
            <select className="select" value={keyType} onChange={e => setKeyType(e.target.value)}>
              {keyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Images</label>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              background: files && files.length > 0 ? 'var(--accent-subtle)' : 'transparent',
              borderColor: files && files.length > 0 ? 'var(--accent)' : 'var(--border)',
            }}
            onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={e => setFiles(e.target.files)}
                style={{ display: 'none' }}
              />
              {files && files.length > 0 ? (
                <p style={{ color: 'var(--accent)', fontWeight: 500 }}>
                  {files.length} image{files.length > 1 ? 's' : ''} selected
                </p>
              ) : (
                <>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Click to select images</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Up to 20 images, 10MB each</p>
                </>
              )}
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-success"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem' }}
          >
            {submitting ? 'Uploading...' : 'Upload Post'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;
