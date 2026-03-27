import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostDetail from './pages/PostDetail';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/post/:id" element={<PostDetail user={user} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
