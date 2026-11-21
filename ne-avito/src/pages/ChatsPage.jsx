import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { CHAT_API } from "../constants";   
import { MdSend } from 'react-icons/md';
import "./styles/ChatsPage.css";

const CHATS_PAGE_SIZE = 20;
const MESSAGES_PAGE_SIZE = 30;

const isTempChat = (chat) => Boolean(chat?.id && String(chat.id).startsWith("temp-"));

export default function ChatsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const targetUserId = searchParams.get("userId");

    const auth = useAuth();
    const token = auth.user?.access_token;
    const isAuthenticated = auth.isAuthenticated;
    const currentUserId = auth.user?.profile?.sub;

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);

    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const [inputText, setInputText] = useState("");

    const chatsLoadingRef = useRef(false);
    const messagesLoadingRef = useRef(false);
    const chatsCursorRef = useRef(null);
    const chatsHasMoreRef = useRef(true);
    const messagesCursorRef = useRef(null);
    const messagesHasMoreRef = useRef(true);
    const activeChatIdRef = useRef(null);
    const selectedChatRef = useRef(null);

    const tokenRef = useRef(token);

    const chatsBottomRef = useRef(null);
    const messagesTopRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesAreaRef = useRef(null);

    const chatsSinceRef = useRef(null);
    const messagesSinceRef = useRef(null);

    const selectedChatId = selectedChat?.id ?? null;

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    const loadChats = useCallback(async (append = false) => {
        const currentToken = tokenRef.current;
        if (!isAuthenticated || !currentToken) return;
        if (chatsLoadingRef.current) return;
        if (append && (!chatsHasMoreRef.current || !chatsCursorRef.current)) return;

        chatsLoadingRef.current = true;
        setIsLoadingChats(true);

        try {
            const url = new URL(CHAT_API);
            url.searchParams.set("size", String(CHATS_PAGE_SIZE));
            if (append) url.searchParams.set("until", chatsCursorRef.current);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${currentToken}` },
            });
            if (!response.ok) throw new Error("Failed to fetch chats");

            const data = await response.json();
            const loaded = Array.isArray(data.chats) ? data.chats : [];

            const previousCursor = chatsCursorRef.current;
            const oldest = loaded[loaded.length - 1]?.lastMessageAt ?? null;


            const more =
                loaded.length >= CHATS_PAGE_SIZE &&
                Boolean(oldest) &&
                oldest !== previousCursor;

            chatsHasMoreRef.current = more;
            if (oldest) chatsCursorRef.current = oldest;

            setChats((prev) => {
                if (append) {
                    const known = new Set(prev.map((c) => c.userId));
                    return [...prev, ...loaded.filter((c) => !known.has(c.userId))];
                }
                const temps = prev.filter(isTempChat);
                const real = loaded.filter((r) => !temps.some((t) => t.userId === r.userId));
                return [...temps, ...real];
            });
        } catch (error) {
            console.error("Error fetching chats:", error);
            chatsHasMoreRef.current = false;
        } finally {
            chatsLoadingRef.current = false;
            setIsLoadingChats(false);
        }
    }, [isAuthenticated]);

    const loadMessages = useCallback(async (chat, lastId = null, prepend = false) => {
        const currentToken = tokenRef.current;
        if (!isAuthenticated || !currentToken) return;
        if (!chat || isTempChat(chat)) return;
        if (messagesLoadingRef.current) return;
        if (prepend && (!messagesHasMoreRef.current || !lastId)) return;

        messagesLoadingRef.current = true;
        setIsLoadingMessages(true);

        const chatId = chat.id;
        const scrollContainer = messagesAreaRef.current;
        const previousScrollHeight = scrollContainer?.scrollHeight ?? 0;

        try {
            const url = new URL(`${CHAT_API}/message/${encodeURIComponent(chat.userId)}`);
            url.searchParams.set("size", String(MESSAGES_PAGE_SIZE));
            if (lastId) url.searchParams.set("lastMessageId", lastId);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${currentToken}` },
            });
            if (!response.ok) throw new Error("Failed to fetch messages");

            const data = await response.json();
            const loaded = Array.isArray(data.messages) ? data.messages : [];

            if (activeChatIdRef.current !== chatId) return;

            const oldest = loaded[loaded.length - 1]?.id ?? null;
            const more =
                loaded.length >= MESSAGES_PAGE_SIZE &&
                Boolean(oldest) &&
                oldest !== lastId;

            messagesHasMoreRef.current = more;
            if (oldest) messagesCursorRef.current = oldest;

            setMessages((prev) => {
                const incoming = [...loaded].reverse();
                if (prepend) {
                    const known = new Set(prev.map((m) => m.id));
                    return [...incoming.filter((m) => !known.has(m.id)), ...prev];
                }
                return incoming;
            });

            setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unread: false } : c)));
        } catch (error) {
            console.error("Error fetching messages:", error);
            if (activeChatIdRef.current === chatId) {
                messagesHasMoreRef.current = false;
            }
        } finally {
            messagesLoadingRef.current = false;
            setIsLoadingMessages(false);

            if (activeChatIdRef.current === chatId) {
                requestAnimationFrame(() => {
                    if (prepend && scrollContainer) {
                        scrollContainer.scrollTop =
                            scrollContainer.scrollHeight - previousScrollHeight;
                    } else if (!prepend) {
                        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                    }
                });
            }
        }
    }, [isAuthenticated]);


    useEffect(() => {
        chatsHasMoreRef.current = true;
        chatsCursorRef.current = null;
        messagesHasMoreRef.current = true;
        messagesCursorRef.current = null;
        activeChatIdRef.current = null;
        chatsSinceRef.current = new Date().toISOString(); 

        setChats([]);
        setSelectedChat(null);
        setMessages([]);

        if (!isAuthenticated || !tokenRef.current) return;
        loadChats(false);
    }, [isAuthenticated, loadChats]);

    // Открытие чата по userId из ссылки.
    useEffect(() => {
        if (!isAuthenticated || !tokenRef.current || !targetUserId) return;

        if (chatsLoadingRef.current) return;

        const existing = chats.find((c) => c.userId === targetUserId);
        if (existing) {
            setSelectedChat(existing);
        } else {
            const tempChat = {
                id: `temp-${targetUserId}`,
                userId: targetUserId,
                lastMessagePreview: "",                
                unread: false,
            };
            setSelectedChat(tempChat);
            setChats((prev) =>
                prev.some((c) => c.userId === targetUserId) ? prev : [tempChat, ...prev],
            );
        }
        setSearchParams({}, { replace: true });
    }, [isAuthenticated, targetUserId, chats, isLoadingChats, setSearchParams]);


    // Временной чат заменяется реальным, когда тот появляется в списке.
    useEffect(() => {
        if (!selectedChat || !isTempChat(selectedChat)) return;
        const real = chats.find((c) => c.userId === selectedChat.userId && !isTempChat(c));
        if (!real) return;
        setSelectedChat(real);
        setChats((prev) =>
            prev.map((c) => (c.userId === real.userId && isTempChat(c) ? real : c)),
        );
    }, [chats, selectedChat]);

    // Смена активного чата
    useEffect(() => {
        const chat = selectedChatRef.current;
        activeChatIdRef.current = chat && !isTempChat(chat) ? chat.id : null;
        messagesCursorRef.current = null;
        messagesHasMoreRef.current = true;
        setMessages([]);

        if (!isAuthenticated || !tokenRef.current || !chat || isTempChat(chat)) return;
        loadMessages(chat, null, false);
    }, [isAuthenticated, selectedChatId, loadMessages]);

    // Подгрузка старых чатов
    useEffect(() => {
        const node = chatsBottomRef.current;
        if (!node || !isAuthenticated || !tokenRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    chatsHasMoreRef.current &&
                    !chatsLoadingRef.current
                ) {
                    loadChats(true);
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [isAuthenticated, loadChats]);

    // Подгрузка старых сообщений.
    useEffect(() => {
        const node = messagesTopRef.current;
        if (
            !node ||
            !isAuthenticated ||
            !tokenRef.current ||
            !selectedChatRef.current ||
            isTempChat(selectedChatRef.current)
        ) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    messagesHasMoreRef.current &&
                    !messagesLoadingRef.current &&
                    messagesCursorRef.current
                ) {
                    loadMessages(selectedChatRef.current, messagesCursorRef.current, true);
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [isAuthenticated, loadMessages, selectedChatId]);

    useEffect(() => {
      if (!isAuthenticated) return;

      const timer = setInterval(async () => {
        const token = tokenRef.current;
        if (!token) return;

        try {
          const since = chatsSinceRef.current;
          const response = await fetch(
            `${CHAT_API}/new?since=${encodeURIComponent(since)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) return;

          const { chats: fresh } = await response.json();
          chatsSinceRef.current = new Date().toISOString();
          if (!fresh?.length) return;

          setChats((prev) => [
            ...fresh,
            ...prev.filter((c) => !fresh.some((f) => f.userId === c.userId)),
          ]);
        } catch (error) {
          console.error("chat polling:", error);
        }
      }, 5000);

      return () => clearInterval(timer);
    }, [isAuthenticated]);


    useEffect(() => {
      const chat = selectedChatRef.current;
      if (!isAuthenticated || !chat || isTempChat(chat)) return;

      messagesSinceRef.current = new Date().toISOString();

      const timer = setInterval(async () => {
        const token = tokenRef.current;
        const opened = selectedChatRef.current;
        if (!token || !opened || isTempChat(opened)) return;

        try {
          const response = await fetch(
            `${CHAT_API}/message/${encodeURIComponent(opened.userId)}/new` +
              `?since=${encodeURIComponent(messagesSinceRef.current)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) return;

          const { messages: fresh } = await response.json();
          messagesSinceRef.current = new Date().toISOString();
          if (!fresh?.length) return;


          setMessages((prev) => {
            const additions = fresh.filter(
              (m) => !prev.some((p) => p.id === m.id),
            );

            const withoutSentTemps = prev.filter((p) => {
              if (!p.isTemp) return true;

              return !additions.some(
                (m) =>
                  m.senderId === p.senderId &&
                  m.text === p.text &&
                  Math.abs(Date.parse(m.createdAt) - Date.parse(p.createdAt)) <
                    5000,
              );
            });

            return [...withoutSentTemps, ...additions];
          });

        } catch (error) {
          console.error("message polling:", error);
        }
      }, 5000);

      return () => clearInterval(timer);
    }, [isAuthenticated, selectedChatId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const currentToken = tokenRef.current;
        if (!isAuthenticated || !currentToken || !inputText.trim() || !selectedChat) return;

        const textToSend = inputText.trim();
        setInputText("");

        const tempMessage = {
            id: `temp-${Date.now()}`,
            text: textToSend,
            senderId: currentUserId,
            createdAt: new Date().toISOString(),
            isTemp: true,
        };
        setMessages((prev) => [...prev, tempMessage]);
        requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));

        try {
            const response = await fetch(
                `${CHAT_API}/message/${encodeURIComponent(selectedChat.userId)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${currentToken}`,
                    },
                    body: JSON.stringify({ text: textToSend }),
                },
            );
            if (!response.ok) throw new Error("Failed to send message");

            setChats((prev) => {
                const index = prev.findIndex((c) => c.id === selectedChat.id);
                if (index === -1) return prev;
                const updated = [...prev];
                const [chat] = updated.splice(index, 1);
                return [
                    {
                        ...chat,
                        lastMessagePreview: textToSend,
                        lastMessageAt: new Date().toISOString(),
                        unread: false,
                    },
                    ...updated,
                ];
            });

        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        }
    };

    return (
      <div
        className={`chats-page-container ${selectedChat ? "chat-open" : ""}`}
      >
        {/* Левая панель: Список чатов */}
        <div className="chats-sidebar">
          <div className="sidebar-header">
            <h2>Сообщения</h2>
          </div>
          <div className="chats-list">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chat-avatar"></div>
                <div className="chat-info">
                  <div className="chat-name-row">
                    <span className="chat-name">
                      {chat.userId}
                    </span>
                    <span className="chat-time">
                      {formatTime(chat.lastMessageAt)}
                    </span>
                  </div>
                  <div className="chat-last-message-row">
                    <span className="chat-last-message">
                      {chat.lastMessagePreview || "Нет сообщений"}
                    </span>
                    {chat.unread && <span className="unread-badge">!</span>}
                  </div>
                </div>
              </div>
            ))}

            {isLoadingChats && (
              <div className="loading-indicator">Загрузка чатов...</div>
            )}
            <div ref={chatsBottomRef} style={{ height: "10px" }} />
          </div>
        </div>

        {/* Правая панель: Активный чат */}
        <div className="chat-main-area">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <button
                  className="back-btn-mobile"
                  onClick={() => setSelectedChat(null)}
                >
                  ←
                </button>
                <div className="chat-user-info">
                  <h3>{ selectedChat.userId}</h3>
                </div>
                <button
                  className="close-chat-btn"
                  onClick={() => {
                    setSelectedChat(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="chat-messages-area" ref={messagesAreaRef}>
                {!isTempChat(selectedChat) && (
                  <div ref={messagesTopRef} style={{ height: "10px" }} />
                )}

                {isLoadingMessages && messages.length === 0 ? (
                  <div className="loading-indicator">Загрузка сообщений...</div>
                ) : (
                  <>
                    {isLoadingMessages && messages.length > 0 && (
                      <div className="loading-indicator-small">
                        Загрузка старых сообщений...
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <div className="empty-chat-placeholder">
                        <p>
                          Начните общение с { selectedChat.userId}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`message-bubble ${
                            msg.senderId === currentUserId
                              ? "my-message"
                              : "other-message"
                          } ${msg.isTemp ? "temp-message" : ""}`}
                        >
                          <p className="message-text">{msg.text}</p>
                          <span className="message-time">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Введите сообщение..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!isAuthenticated || !token || isLoadingMessages}
                  />

                  <button
                    type="submit"
                    disabled={
                      !isAuthenticated ||
                      !token ||
                      !inputText.trim() ||
                      isLoadingMessages
                    }
                  >
                    <MdSend size={24} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">💬</div>
              <h3>Выберите, кому хотели бы написать</h3>
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
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
}
