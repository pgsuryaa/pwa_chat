

import React, { useEffect, useState } from 'react';
import './App.css';


const API_URL = 'https://chat-ws-9epm.onrender.com';

async function fetchMessages() {
  try {
    const res = await fetch(`${API_URL}/messages`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return null;
  }
}

async function postMessage(msg) {
  try {
    const res = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    return await res.json();
  } catch {
    return null;
  }
}


const userA = { name: 'Buuu', avatar: '🧑‍🦰' };
const userB = { name: 'Me', avatar: '🧑' };

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  // WebSocket ref
  const wsRef = React.useRef(null);

  // Load messages from server on mount
  useEffect(() => {
    fetchMessages().then((msgs) => {
      if (msgs && Array.isArray(msgs)) {
        setMessages(msgs);
      } else {
        setMessages([
          { from: userA.name, text: 'Hey! How are you?', sent: false },
          { from: userB.name, text: 'I’m good! You?', sent: true },
          { from: userA.name, text: 'Doing great 😊', sent: false },
        ]);
      }
      setLoading(false);
    });

    // Connect WebSocket
    wsRef.current = new window.WebSocket(API_URL.replace(/^http/, 'ws'));
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'history' && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else if (data.text) {
          setMessages((prev) => [...prev, data]);
        }
      } catch {}
    };
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const sendMessage = async () => {
    if (input.trim()) {
      const newMsg = { from: userB.name, text: input, sent: true };
      await postMessage(newMsg); // REST for persistence and broadcast
      setInput('');
    }
  };

  if (loading) {
    return <div className="imessage-container">Loading...</div>;
  }

  return (
    <div className="imessage-container">
      <main className="chat-area">
        <header className="chat-header">
          <span className="avatar">{userA.avatar}</span>
          <span className="contact-name">{userA.name}</span>
        </header>
        <section className="messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message-bubble${msg.sent ? ' sent' : ' received'}`}
            >
              {msg.text}
            </div>
          ))}
        </section>
        <footer className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="iMessage..."
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </footer>
      </main>
    </div>
  );
}

export default App;
