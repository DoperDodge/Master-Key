import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
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

  const inputStyle = { width: '100%', padding: '0.5rem', marginBottom: '1rem', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={inputStyle} />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%',
          fontSize: '1rem'
        }}>
          Login
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
