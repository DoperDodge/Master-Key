import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (user && user.is_admin) {
      const fetchCount = () => {
        fetch('/api/admin/reports/count')
          .then(r => r.json())
          .then(data => setReportCount(data.count || 0))
          .catch(() => {});
      };
      fetchCount();
      const interval = setInterval(fetchCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    navigate('/');
  };

  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(15, 15, 19, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 1.5rem',
  };

  const innerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
  };

  const logoStyle = {
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontSize: '1.2rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const linkStyle = {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition)',
  };

  const hamburgerStyle = {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem',
  };

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <Link to="/" style={logoStyle}>
          <span style={{ fontSize: '1.4rem' }}>🔑</span>
          Master Key
        </Link>

        <button
          style={hamburgerStyle}
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <Link to="/" style={linkStyle} onClick={() => setMenuOpen(false)}>Browse</Link>
          {user ? (
            <>
              <Link to="/upload" style={linkStyle} onClick={() => setMenuOpen(false)}>Upload</Link>
              <Link to="/dashboard" style={linkStyle} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/messages" style={linkStyle} onClick={() => setMenuOpen(false)}>Messages</Link>
              {user.is_admin && (
                <Link to="/admin" style={{ ...linkStyle, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setMenuOpen(false)}>
                  Admin
                  {reportCount > 0 && (
                    <span style={{
                      background: 'var(--danger)', color: '#fff', fontSize: '0.65rem',
                      borderRadius: '10px', padding: '0.1rem 0.4rem', fontWeight: 700,
                      minWidth: '18px', textAlign: 'center', lineHeight: '1.3',
                    }}>{reportCount}</span>
                  )}
                </Link>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginLeft: '0.5rem',
                paddingLeft: '0.75rem',
                borderLeft: '1px solid var(--border)',
              }} className="nav-user">
                <span style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}>{user.username}</span>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Login</button>
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Sign Up</button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .nav-links a:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .hamburger { display: none; }

        @media (max-width: 768px) {
          .hamburger { display: block !important; }
          .nav-links {
            display: ${menuOpen ? 'flex' : 'none'};
            flex-direction: column;
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            padding: 1rem;
            gap: 0.5rem;
          }
          .nav-links a {
            width: 100%;
            padding: 0.75rem 1rem !important;
          }
          .nav-user {
            border-left: none !important;
            border-top: 1px solid var(--border);
            padding-left: 0 !important;
            padding-top: 0.75rem;
            margin-left: 0 !important;
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
