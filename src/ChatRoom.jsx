import React, { useState, useEffect, useRef } from 'react';
import { encryptMessage, decryptMessage } from './cryptoHelper';
import { formatChatDate, formatChatTime, getChatDateSeparator } from './dateFormatter';
import './ChatRoom.css';

export default function ChatRoom() {
  const currentUserId = localStorage.getItem('user_id');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatList, setChatList] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [uiMessage, setUiMessage] = useState('');
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [unreadNewMessages, setUnreadNewMessages] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [contactModalMode, setContactModalMode] = useState('new');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || '/api';
  const previousHistoryLengthRef = useRef(0);

  const scrollToBottom = () => {
    const behavior = (typeof window !== 'undefined' && window.innerWidth <= 600) ? 'auto' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const isAtBottom = () => {
    if (!messagesContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 50;
  };

  const handleMessagesScroll = () => {
    const isBottom = isAtBottom();
    setIsUserAtBottom(isBottom);
    if (isBottom) {
      setUnreadNewMessages(false);
    }
  };

  const getNameParts = (fullName) => {
    const parts = fullName?.trim().split(/\s+/) || [];
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  const openContactModal = (mode = 'new', contact = null) => {
    setErrorMessage('');
    setStatusMessage('');
    setContactModalMode(mode);
    if (mode === 'edit' && contact) {
      const { firstName, lastName } = getNameParts(contact.display_name || '');
      setNewFirstName(firstName);
      setNewLastName(lastName);
      setNewPhone(contact.phone_number || '');
    } else {
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
    }
    setModalOpen(true);
  };

  const markMessagesAsRead = async () => {
    if (!activeContact || !currentUserId) return;
    const unreadMessages = chatHistory.filter(
      msg => String(msg.receiver_id) === String(currentUserId) && msg.is_read === 0 && msg.id
    );
    
    for (const msg of unreadMessages) {
      try {
        const fd = new FormData();
        fd.append('message_id', msg.id);
        fd.append('receiver_id', currentUserId);
        await fetch(`${apiUrl}/mark_message_read.php`, { method: 'POST', body: fd });
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };

  const loadChatList = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${apiUrl}/fetch_chat_list.php?user_id=${currentUserId}`);
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.chats)) {
        const processedList = await Promise.all(
          data.chats.map(async (chat) => {
            const unreadCount = Number(chat.unread_count || 0);
            const isSaved = Number(chat.is_saved || 0) === 1;
            if (chat.last_message) {
              const clearText = await decryptMessage(chat.last_message, chat.last_iv, currentUserId, chat.id);
              const senderLabel = String(chat.last_sender_id) === String(currentUserId) ? 'You' : '';
              return { ...chat, snippet: clearText, senderLabel, unreadCount, isSaved };
            }
            return { ...chat, snippet: '', senderLabel: '', unreadCount, isSaved };
          })
        );

        const sortedList = processedList.sort((a, b) => {
          const aTime = a.last_time ? new Date(a.last_time).getTime() : 0;
          const bTime = b.last_time ? new Date(b.last_time).getTime() : 0;
          if (bTime === aTime) {
            return (b.unreadCount || 0) - (a.unreadCount || 0);
          }
          return bTime - aTime;
        });

        setChatList(sortedList);
      } else {
        setChatList([]);
      }
    } catch (err) {
      console.error('Chat list error:', err);
      setErrorMessage('Unable to load chats. Please refresh.');
    }
  };

  const handleCreateContactSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!newFirstName.trim() || !newPhone.trim()) {
      setErrorMessage('Please provide a name and phone number.');
      return;
    }

    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
    const fd = new FormData();
    fd.append('user_id', currentUserId);
    fd.append('phone_number', newPhone.trim());
    fd.append('saved_name', fullName);

    try {
      const res = await fetch(`${apiUrl}/find_contact.php`, { method: 'POST', body: fd });
      const data = await res.json();

      if (data.status === 'success') {
        const target = {
          id: data.contact.contact_user_id,
          phone_number: newPhone.trim(),
          display_name: data.contact.saved_name,
          profile_image_url: data.contact.profile_image_url,
          isSaved: true
        };
        setActiveContact(target);
        setModalOpen(false);
        setContactModalMode('new');
        setNewFirstName('');
        setNewLastName('');
        setNewPhone('');
        setStatusMessage('Contact saved. Ready to chat!');
        loadChatList();
      } else {
        setErrorMessage(data.message || 'Unable to find contact.');
      }
    } catch (err) {
      console.error('Contact error:', err);
      setErrorMessage('Failed to verify contact. Try again.');
    }
  };

  const loadConversation = async () => {
    if (!activeContact || !currentUserId) return;
    try {
      const res = await fetch(`${apiUrl}/fetch_msgs.php?user_id=${currentUserId}&recipient_id=${activeContact.id}`);
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.messages)) {
        const resolvedHistory = await Promise.all(
          data.messages.map(async (msg) => {
            const clearText = await decryptMessage(msg.encrypted_text, msg.iv_params, msg.sender_id, msg.receiver_id);
            return { ...msg, decryptedText: clearText };
          })
        );
        setChatHistory(resolvedHistory);
        setTimeout(() => {
          markMessagesAsRead();
        }, 500);
      } else {
        setChatHistory([]);
      }
    } catch (err) {
      console.error('Conversation error:', err);
      setErrorMessage('Unable to load messages.');
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    loadChatList();
    const listPoller = setInterval(loadChatList, 3000);
    return () => clearInterval(listPoller);
  }, [currentUserId]);

  useEffect(() => {
    if (!activeContact || !currentUserId) return;
    loadConversation();
    const msgPoller = setInterval(loadConversation, 2500);
    return () => clearInterval(msgPoller);
  }, [activeContact, currentUserId]);

  useEffect(() => {
    const newMessagesArrived = chatHistory.length > previousHistoryLengthRef.current;
    const shouldAutoScroll = isUserAtBottom || previousHistoryLengthRef.current === 0;

    if (newMessagesArrived) {
      if (shouldAutoScroll) {
        setUnreadNewMessages(false);
        setTimeout(() => scrollToBottom(), 50);
      } else {
        setUnreadNewMessages(true);
      }
    }

    previousHistoryLengthRef.current = chatHistory.length;
  }, [chatHistory, isUserAtBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!typedMessage.trim() || !activeContact) return;

    try {
      const { ciphertext, ivString } = await encryptMessage(typedMessage, currentUserId, activeContact.id);
      const fd = new FormData();
      fd.append('sender_id', currentUserId);
      fd.append('receiver_id', activeContact.id);
      fd.append('encrypted_text', ciphertext);
      fd.append('iv_params', ivString);

      const res = await fetch(`${apiUrl}/send_msg.php`, { method: 'POST', body: fd });
      const data = await res.json();

      if (data.status === 'success') {
        setTypedMessage('');
        setStatusMessage('Sent!');
        loadConversation();
        loadChatList();
      } else {
        setErrorMessage(data.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Send error:', err);
      setErrorMessage('Unable to send message. Try again.');
    }
  };

  const filteredChats = chatList.filter((chat) =>
    chat.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.phone_number?.includes(searchQuery)
  );

  const visibleChats = filteredChats.slice().sort((a, b) => {
    const aTime = a.last_time ? new Date(a.last_time).getTime() : 0;
    const bTime = b.last_time ? new Date(b.last_time).getTime() : 0;
    if (bTime === aTime) {
      return (b.unreadCount || 0) - (a.unreadCount || 0);
    }
    return bTime - aTime;
  });

  if (!currentUserId) {
    return (
      <div className="chat-room chat-room--empty">
        <p>Please log in to use the chat feature.</p>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-room__panel">
        {!activeContact ? (
          <>
            <div className="chat-room__panel-header">
              <h2 className="chat-room__title">Five Star</h2>
              <button className="chat-room__button" onClick={() => openContactModal('new')}>
                + New Contact
              </button>
            </div>

            <div className="chat-room__search-row">
              <input
                className="chat-room__search-input"
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="chat-room__list">
              {visibleChats.length > 0 ? (
                visibleChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    className="chat-room__contact-item"
                    onClick={() => setActiveContact(chat)}
                  >
                    <div className="chat-room__avatar">
                      {chat.profile_image_url ? (
                        <img src={chat.profile_image_url} alt="Avatar" />
                      ) : (
                        chat.display_name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div className="chat-room__contact-details">
                      <div className="chat-room__contact-title-row">
                        <p className="chat-room__contact-name">{chat.display_name}</p>
                        {chat.unreadCount > 0 && (
                          <span className="chat-room__unread-badge">{chat.unreadCount}</span>
                        )}
                      </div>
                      <p className="chat-room__contact-snippet">
                        {chat.senderLabel && <span className="chat-room__sender-label">{chat.senderLabel}: </span>}
                        {chat.snippet || 'No message history'}
                      </p>
                      {!chat.isSaved && (
                        <span className="chat-room__contact-tag">Unsaved</span>
                      )}
                    </div>
                    <span className="chat-room__contact-meta">
                      {chat.last_time ? new Date(chat.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </button>
                ))
              ) : (
                <div className="chat-room__empty-state">No chats yet. Add a contact to start.</div>
              )}
            </div>

            {(errorMessage || statusMessage) && (
              <div className="chat-room__feedback">
                {errorMessage || statusMessage}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="chat-room__conversation-panel">
              <div className="chat-room__conversation-header">
              <button
                className="chat-room__button"
                type="button"
                onClick={() => {
                  setActiveContact(null);
                  setChatHistory([]);
                  setErrorMessage('');
                  setStatusMessage('');
                }}
              >
                ← Back
              </button>
              <button
                className="chat-room__button chat-room__save-contact-button"
                type="button"
                onClick={() => openContactModal('edit', activeContact)}
              >
                {activeContact?.isSaved ? 'Edit contact' : 'Save contact'}
              </button>
              <div className="chat-room__avatar">
                {activeContact.profile_image_url ? (
                  <img src={activeContact.profile_image_url} alt="Avatar" />
                ) : (
                  activeContact.display_name?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div className="chat-room__conversation-info">
                <p className="chat-room__conversation-name">{activeContact.display_name}</p>
                <p className="chat-room__conversation-subtitle">Five Star End-to-End Encrypted</p>
              </div>
              </div>

              <div className="chat-room__messages" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
              {unreadNewMessages && (
                <div className="chat-room__new-message-alert">
                  <span>You are reading older messages. New messages have arrived.</span>
                  <button
                    type="button"
                    className="chat-room__new-message-button"
                    onClick={() => {
                      setUnreadNewMessages(false);
                      scrollToBottom();
                    }}
                  >
                    Jump to latest
                  </button>
                </div>
              )}
              {chatHistory.length > 0 ? (
                chatHistory.map((msg, idx) => {
                  const isMe = String(msg.sender_id) === String(currentUserId);
                  const showDateSeparator = idx === 0 || getChatDateSeparator(msg.created_at) !== getChatDateSeparator(chatHistory[idx - 1].created_at);

                  return (
                    <div key={idx}>
                      {showDateSeparator && (
                        <div className="chat-room__date-separator">
                          <span className="chat-room__date-text">{getChatDateSeparator(msg.created_at)}</span>
                        </div>
                      )}
                      <div
                        className={`chat-room__message-wrapper ${isMe ? 'chat-room__message-wrapper--mine' : ''}`}
                      >
                        <div className="chat-room__message-bubble">{msg.decryptedText}</div>
                        <span className="chat-room__message-time">
                          {formatChatTime(msg.created_at)}
                          {isMe && (
                            <span className={`chat-room__message-tick ${msg.is_read ? 'chat-room__message-tick--read' : ''}`}>
                              ✓✓
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="chat-room__empty-state">Start chatting with {activeContact.display_name}</div>
              )}
              <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="chat-room__composer" onSubmit={handleSendMessage}>
              <input
                className="chat-room__composer-input"
                type="text"
                placeholder="Type a message..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
              />
              <button className="chat-room__composer-button" type="submit">
                Send
              </button>
            </form>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="chat-room__modal-overlay">
          <div className="chat-room__modal">
            <div className="chat-room__modal-header">
              <h3 className="chat-room__modal-title">{contactModalMode === 'edit' ? 'Edit Contact' : 'New Contact'}</h3>
              <button
                className="chat-room__modal-close"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="chat-room__modal-body">
              <form onSubmit={handleCreateContactSubmit}>
                <div className="chat-room__field">
                  <label className="chat-room__field-label">First Name</label>
                  <input className="chat-room__field-input" type="text" placeholder="First name" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} required />
                </div>
                <div className="chat-room__field">
                  <label className="chat-room__field-label">Last Name</label>
                  <input className="chat-room__field-input" type="text"
                    placeholder="Last name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                </div>
                <div className="chat-room__field-group">
                  <div className="chat-room__field">
                    <label className="chat-room__field-label">Phone number</label>
                    <input
                      className="chat-room__field-input"
                      type="text"
                      placeholder="07xxxxxxxx"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      required
                      readOnly={contactModalMode === 'edit'}
                    />
                  </div>
                </div>
                {errorMessage && <div className="chat-room__feedback">{errorMessage}</div>}
                <button className="chat-room__modal-submit" type="submit">
                  Save & Chat
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
