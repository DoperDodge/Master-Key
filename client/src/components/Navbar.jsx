import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    navigate('/');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#1a1a2e',
      color: '#fff'
    }}>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
        School Photos
      </Link>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#ccc', textDecoration: 'none' }}>Home</Link>
        {user ? (
          <>
            <Link to="/upload" style={{ color: '#ccc', textDecoration: 'none' }}>Upload</Link>
            <Link to="/dashboard" style={{ color: '#ccc', textDecoration: 'none' }}>Dashboard</Link>
            <span style={{ color: '#aaa' }}>Hi, {user.username}</span>
            <button onClick={handleLogout} style={{
              background: '#e74c3c',
              color: '#fff',
              border: 'none',
              padding: '0.4rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#ccc', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#ccc', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
