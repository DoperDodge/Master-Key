import { useState, useEffect, useRef } from 'react';

function Messages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [convInfo, setConvInfo] = useState(null);
  const [msgBody, setMsgBody] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState('dm');
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showManage, setShowManage] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState([]);
  const [showClosed, setShowClosed] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  if (!user) {
    return (
      <div className="empty-state">
        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</p>
        <p>Please log in to access messages.</p>
      </div>
    );
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv);
      pollRef.current = setInterval(() => loadMessages(activeConv), 5000);
      return () => clearInterval(pollRef.current);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = () => {
    fetch('/api/messages/conversations')
      .then(r => r.json())
      .then(setConversations)
      .catch(() => {});
  };

  const loadMessages = (convId) => {
    fetch(`/api/messages/conversations/${convId}`)
      .then(r => r.json())
      .then(data => {
        setConvInfo(data.conversation);
        setMessages(data.messages);
      })
      .catch(() => {});
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgBody.trim()) return;
    const res = await fetch(`/api/messages/conversations/${activeConv}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: msgBody })
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages([...messages, msg]);
      setMsgBody('');
    }
  };

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const res = await fetch(`/api/messages/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.filter(u => !selectedUsers.find(s => s.id === u.id)));
  };

  const createConversation = async () => {
    if (selectedUsers.length === 0) return;
    const res = await fetch('/api/messages/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: newType,
        name: newType === 'group' ? groupName : undefined,
        member_ids: selectedUsers.map(u => u.id)
      })
    });
    if (res.ok) {
      const data = await res.json();
      setShowNew(false);
      setSelectedUsers([]);
      setSearchQuery('');
      setGroupName('');
      loadConversations();
      setActiveConv(data.id);
    }
  };

  const toggleConversation = async (convId, closed) => {
    await fetch(`/api/messages/conversations/${convId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closed })
    });
    loadConversations();
    if (closed && activeConv === convId) {
      setActiveConv(null);
      setMessages([]);
      setConvInfo(null);
    }
  };

  const kickMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await fetch(`/api/messages/conversations/${activeConv}/members/${userId}`, { method: 'DELETE' });
    loadMessages(activeConv);
  };

  const addMember = async (userId) => {
    await fetch(`/api/messages/conversations/${activeConv}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    setAddQuery('');
    setAddResults([]);
    loadMessages(activeConv);
  };

  const searchAddUsers = async (q) => {
    setAddQuery(q);
    if (q.length < 1) { setAddResults([]); return; }
    const res = await fetch(`/api/messages/users/search?q=${encodeURIComponent(q)}`);
    setAddResults(await res.json());
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !reportTarget) return;
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_type: 'message',
        target_id: reportTarget,
        reason: reportReason
      })
    });
    setReportTarget(null);
    setReportReason('');
    alert('Report submitted.');
  };

  const getConvName = (conv) => {
    if (conv.name) return conv.name;
    if (conv.members) {
      const others = conv.members.filter(m => m.id !== user.id);
      return others.map(m => m.username).join(', ') || 'Chat';
    }
    return 'Chat';
  };

  const openConvs = conversations.filter(c => !c.closed);
  const closedConvs = conversations.filter(c => c.closed);

  return (
    <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 120px)', minHeight: '400px' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
      }} className="msg-sidebar">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Messages</h2>
          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setShowNew(true)}>+ New</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {openConvs.map(conv => (
            <div key={conv.id} onClick={() => setActiveConv(conv.id)} style={{
              padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
              background: activeConv === conv.id ? 'var(--bg-hover)' : 'transparent',
              transition: 'background var(--transition)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{getConvName(conv)}</span>
                <span className="badge" style={{ fontSize: '0.65rem' }}>{conv.type}</span>
              </div>
              {conv.last_message && (
                <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message.username}: {conv.last_message.body}
                </p>
              )}
            </div>
          ))}
          {closedConvs.length > 0 && (
            <>
              <button onClick={() => setShowClosed(!showClosed)} style={{
                width: '100%', padding: '0.5rem 1rem', background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid var(--border)',
              }}>
                {showClosed ? '▼' : '►'} Closed ({closedConvs.length})
              </button>
              {showClosed && closedConvs.map(conv => (
                <div key={conv.id} style={{
                  padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  opacity: 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.85rem' }}>{getConvName(conv)}</span>
                  <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                    onClick={() => toggleConversation(conv.id, false)}>Open</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {activeConv && convInfo ? (
          <>
            <div style={{
              padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="msg-back-btn" style={{
                    display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '1.2rem', padding: '0',
                  }} onClick={() => { setActiveConv(null); setMessages([]); setConvInfo(null); }}>←</button>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{getConvName(convInfo)}</h3>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {convInfo.members?.length} members
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {convInfo.type === 'group' && convInfo.owner_id === user.id && (
                  <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={() => setShowManage(!showManage)}>Manage</button>
                )}
                <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={() => toggleConversation(activeConv, true)}>Close</button>
              </div>
            </div>

            {showManage && convInfo.type === 'group' && (
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Members</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {convInfo.members?.map(m => (
                    <span key={m.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.5rem', background: 'var(--bg-hover)', borderRadius: '20px', fontSize: '0.8rem',
                    }}>
                      {m.username}
                      {m.id !== user.id && m.id !== convInfo.owner_id && (
                        <button onClick={() => kickMember(m.id)} style={{
                          background: 'none', border: 'none', color: 'var(--danger)',
                          cursor: 'pointer', fontSize: '0.9rem', padding: 0, lineHeight: 1,
                        }}>×</button>
                      )}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="Search users to add..." value={addQuery}
                    onChange={e => searchAddUsers(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
                </div>
                {addResults.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                    {addResults.map(u => (
                      <button key={u.id} className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => addMember(u.id)}>{u.username} +</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.map(msg => {
                const isMe = msg.user_id === user.id;
                return (
                  <div key={msg.id} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '75%', alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}>
                    {!isMe && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                        {msg.username}
                      </span>
                    )}
                    <div style={{
                      padding: '0.6rem 0.9rem',
                      background: isMe ? 'var(--accent)' : 'var(--bg-card)',
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: '0.9rem', lineHeight: 1.4, wordBreak: 'break-word',
                    }}>
                      {msg.body}
                      {msg.edited && <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '0.4rem' }}>(edited)</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isMe && (
                        <button onClick={() => setReportTarget(msg.id)} style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)',
                          cursor: 'pointer', fontSize: '0.6rem', padding: 0, opacity: 0.5,
                        }} title="Report message">⚑</button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{
              padding: '0.75rem 1rem', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '0.5rem',
            }}>
              <input className="input" value={msgBody} onChange={e => setMsgBody(e.target.value)}
                placeholder="Type a message..." style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
              <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</p>
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowNew(false)}>
          <div className="card" style={{ padding: '1.5rem', width: '400px', maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>New Conversation</h3>

            <div className="form-group">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className={`btn ${newType === 'dm' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, padding: '0.4rem' }} onClick={() => { setNewType('dm'); setSelectedUsers([]); }}>Direct Message</button>
                <button className={`btn ${newType === 'group' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, padding: '0.4rem' }} onClick={() => setNewType('group')}>Group Chat</button>
              </div>
            </div>

            {newType === 'group' && (
              <div className="form-group">
                <label className="label">Group Name</label>
                <input className="input" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Enter group name" />
              </div>
            )}

            <div className="form-group">
              <label className="label">Add {newType === 'dm' ? 'User' : 'Members'}</label>
              <input className="input" value={searchQuery} onChange={e => searchUsers(e.target.value)} placeholder="Search by username..." />
              {searchResults.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {searchResults.map(u => (
                    <button key={u.id} className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      onClick={() => {
                        if (newType === 'dm') setSelectedUsers([u]);
                        else setSelectedUsers([...selectedUsers, u]);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}>{u.username}</button>
                  ))}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
                {selectedUsers.map(u => (
                  <span key={u.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.25rem 0.6rem', background: 'var(--accent-subtle)', color: 'var(--accent)',
                    borderRadius: '20px', fontSize: '0.8rem',
                  }}>
                    {u.username}
                    <button onClick={() => setSelectedUsers(selectedUsers.filter(s => s.id !== u.id))} style={{
                      background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1,
                    }}>×</button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createConversation}
                disabled={selectedUsers.length === 0 || (newType === 'group' && !groupName)}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => { setReportTarget(null); setReportReason(''); }}>
          <div className="card" style={{ padding: '1.5rem', width: '400px', maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>Report Message</h3>
            <div className="form-group">
              <label className="label">Reason</label>
              <textarea className="textarea" value={reportReason} onChange={e => setReportReason(e.target.value)}
                placeholder="Describe why you're reporting this message..." rows={3} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setReportTarget(null); setReportReason(''); }}>Cancel</button>
              <button className="btn btn-danger" onClick={submitReport} disabled={!reportReason.trim()}>Submit Report</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .msg-sidebar {
            ${activeConv ? 'display: none !important;' : 'width: 100% !important;'}
          }
          .msg-back-btn {
            display: inline-block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Messages;
