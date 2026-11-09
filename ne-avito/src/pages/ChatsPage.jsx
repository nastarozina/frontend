import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import "./styles/ChatsPage.css";

const API_BASE = "http://localhost:8080/api";

const CURRENT_USER_ID = "current-user-id";

export default function ChatsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const targetUserId = searchParams.get("userId");

    
    const [chats, setChats] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const lastChatAfterRef = useRef(null);

    
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const lastMessageIdRef = useRef(null);

    
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);
    const messagesTopRef = useRef(null);

    
    const fetchChats = useCallback(async (after = null, append = false) => {
        if (isLoadingChats || (!append && chats.length > 0)) return;
        setIsLoadingChats(true);

        try {
            const url = new URL(`${API_BASE}/chat`);
            url.searchParams.set("size", "20");
            if (after) url.searchParams.set("after", after);

            const response = await fetch(url, {
                headers: { "X-User-Id": CURRENT_USER_ID }
            });

            if (!response.ok) throw new Error("Failed to fetch chats");

            const data = await response.json();

            if (data.chats.length < 20) {
                setHasMoreChats(false);
            }

            if (data.chats.length > 0) {
                lastChatAfterRef.current = data.chats[data.chats.length - 1].lastModifiedAt;
            }

            setChats(prev => append ? [...prev, ...data.chats] : data.chats);
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setIsLoadingChats(false);
        }
    }, [isLoadingChats, chats.length]);

    
    const fetchMessages = useCallback(async (chat, lastId = null, prepend = false) => {
        if (!chat || isLoadingMessages) return;
        setIsLoadingMessages(true);

        const scrollContainer = messagesTopRef.current?.parentElement;
        const oldScrollHeight = scrollContainer?.scrollHeight || 0;

        try {
            const url = new URL(`${API_BASE}/message/${chat.userId}`);
            url.searchParams.set("size", "30");
            if (lastId) url.searchParams.set("lastMessageId", lastId);

            const response = await fetch(url, {
                headers: { "X-User-Id": CURRENT_USER_ID }
            });

            if (!response.ok) throw new Error("Failed to fetch messages");

            const data = await response.json();

            if (data.messages.length < 30) {
                setHasMoreMessages(false);
            }

            if (data.messages.length > 0) {
                lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
            }

            setMessages(prev => {
                if (prepend) {
                    return [...data.messages.slice().reverse(), ...prev];
                }
                return data.messages.slice().reverse();
            });

            setChats(prevChats => prevChats.map(c =>
                c.id === chat.id ? { ...c, unread: false } : c
            ));

        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setIsLoadingMessages(false);

            if (prepend && scrollContainer) {
                setTimeout(() => {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight - oldScrollHeight;
                }, 0);
            }
        }
    }, [isLoadingMessages]);


    useEffect(() => {
        fetchChats(null, false);
    }, [fetchChats]);

    useEffect(() => {
        if (targetUserId && !selectedChat) {
            const existingChat = chats.find(c => c.userId === targetUserId);
            if (existingChat) {
                setSelectedChat(existingChat);
                setSearchParams({});
            } else {
                const tempChat = {
                    id: `temp-${targetUserId}`,
                    userId: targetUserId,
                    userName: `Пользователь ${targetUserId}`,
                    lastMessage: "",
                    lastModifiedAt: new Date().toISOString(),
                    unread: false
                };
                setSelectedChat(tempChat);
                setChats(prev => [tempChat, ...prev]);
                setSearchParams({});
            }
        }
    }, [targetUserId, chats, selectedChat, setSearchParams]);

    useEffect(() => {
        if (selectedChat) {
            setMessages([]);
            setHasMoreMessages(true);
            lastMessageIdRef.current = null;
            fetchMessages(selectedChat, null, false);
        }
    }, [selectedChat, fetchMessages]);

    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedChat) return;

        const textToSend = inputText;
        setInputText("");

        const tempMessage = {
            id: `temp-${Date.now()}`,
            text: textToSend,
            senderId: CURRENT_USER_ID,
            createdAt: new Date().toISOString(),
            isTemp: true
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            await fetch(`${API_BASE}/message/${selectedChat.userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": CURRENT_USER_ID
                },
                body: JSON.stringify({ text: textToSend })
            });

            // После успешной отправки обновляем превью чата в списке
            setChats(prev => {
                const updatedChats = prev.map(c =>
                    c.id === selectedChat.id
                        ? { ...c, lastMessage: textToSend, lastModifiedAt: new Date().toISOString(), unread: false }
                        : c
                );
                // Перемещаем обновленный чат наверх списка
                const chatIndex = updatedChats.findIndex(c => c.id === selectedChat.id);
                if (chatIndex > 0) {
                    const [chat] = updatedChats.splice(chatIndex, 1);
                    updatedChats.unshift(chat);
                }
                return updatedChats;
            });

        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const chatListBottomRef = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMoreChats && !isLoadingChats) {
                fetchChats(lastChatAfterRef.current, true);
            }
        }, { threshold: 0.1 });

        if (chatListBottomRef.current) observer.observe(chatListBottomRef.current);
        return () => observer.disconnect();
    }, [hasMoreChats, isLoadingChats, fetchChats]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMoreMessages && !isLoadingMessages && messages.length > 0) {
                fetchMessages(selectedChat, lastMessageIdRef.current, true);
            }
        }, { threshold: 0.1 });

        if (messagesTopRef.current) observer.observe(messagesTopRef.current);
        return () => observer.disconnect();
    }, [hasMoreMessages, isLoadingMessages, messages.length, selectedChat, fetchMessages]);


    return (
        <div className={`chats-page-container ${selectedChat ? 'chat-open' : ''}`}>
            {/* Левая панель: Список чатов */}
            <div className="chats-sidebar">
                <div className="sidebar-header">
                    <h2>Сообщения</h2>
                </div>
                <div className="chats-list">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="chat-avatar">{chat.userName?.[0]?.toUpperCase() || '?'}</div>
                            <div className="chat-info">
                                <div className="chat-name-row">
                                    <span className="chat-name">{chat.userName || chat.userId}</span>
                                    <span className="chat-time">{formatTime(chat.lastModifiedAt)}</span>
                                </div>
                                <div className="chat-last-message-row">
                                    <span className="chat-last-message">
                                        {chat.lastMessagePreview || chat.lastMessage || "Нет сообщений"}
                                    </span>
                                    {chat.unread && <span className="unread-badge">!</span>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoadingChats && <div className="loading-indicator">Загрузка чатов...</div>}
                    <div ref={chatListBottomRef} style={{ height: '10px' }} />
                </div>
            </div>

            {/* Правая панель: Активный чат */}
            <div className="chat-main-area">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <button className="back-btn-mobile" onClick={() => setSelectedChat(null)}>
                                ←
                            </button>
                            <div className="chat-user-info">
                                <h3>{selectedChat.userName || selectedChat.userId}</h3>
                                <span className="online-status">В сети</span>
                            </div>
                            <button className="close-chat-btn" onClick={() => {
                                setSelectedChat(null);
                                navigate(-1);
                            }}>
                                ✕
                            </button>
                        </div>

                        <div className="chat-messages-area">
                            {isLoadingMessages && messages.length === 0 ? (
                                <div className="loading-indicator">Загрузка сообщений...</div>
                            ) : (
                                <>
                                    <div ref={messagesTopRef} style={{ height: '10px' }} />
                                    {isLoadingMessages && messages.length > 0 && (
                                        <div className="loading-indicator-small">Загрузка старых сообщений...</div>
                                    )}

                                    {messages.length === 0 ? (
                                        <div className="empty-chat-placeholder">
                                            <p>Начните общение с {selectedChat.userName || selectedChat.userId}</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`message-bubble ${msg.senderId === CURRENT_USER_ID ? "my-message" : "other-message"} ${msg.isTemp ? "temp-message" : ""}`}
                                            >
                                                <p className="message-text">{msg.text}</p>
                                                <span className="message-time">{formatTime(msg.createdAt)}</span>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Введите сообщение..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={isLoadingMessages}
                            />
                            <button type="submit" disabled={!inputText.trim() || isLoadingMessages}>
                                Отправить
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-icon">💬</div>
                        <h3>Выберите чат, чтобы начать общение</h3>
                        <p>Или вернитесь к просмотру баннеров</p>
                        <button className="back-to-banners-btn" onClick={() => navigate("/")}>
                            К баннерам
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
