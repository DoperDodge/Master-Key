import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setUser(data.user);
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <h1 className="page-title" style={{ textAlign: 'center' }}>Create Account</h1>
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Username</label>
            <input className="input" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Choose a username" />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem' }}>
            Create Account
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
