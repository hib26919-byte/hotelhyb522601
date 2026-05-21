import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, X, PhoneCall, Link as LinkIcon, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import {
  ATTRACTIONS,
  HOTEL_INFO,
  HOTEL_KNOWLEDGE,
  INTENTS,
  QUICK_REPLY_OPTIONS,
  ROOM_CATEGORIES,
} from "../utils/siteData";

const STORAGE_KEY = "bael-tree-chatbot-history";

const defaultMessages = [
  {
    id: "welcome",
    author: "bot",
    content: "Welcome to Bael Tree Hotels! How may I assist you today?",
  },
];

const intentResponses = {
  greeting: { text: "A warm welcome to Bael Tree Hotels. I can help with rooms, dining, bookings, and local directions." },
  rooms: {
    text: "We have Standard, Executive, Premium, and Suite rooms available. You can explore all our luxurious options.",
    action: { type: "link", url: "/rooms", label: "Explore All Rooms", icon: "link" }
  },
  pricing: {
    text: "Our room prices range from ₹2,500 to ₹6,000 depending on the category and occupancy.",
    action: { type: "link", url: "/rooms", label: "View Pricing Details", icon: "link" }
  },
  dining: {
    text: "Breakfast is served from 7:00 AM. You can dine at Kadali Patra or The Soul Curry.",
    action: { type: "link", url: "/dining", label: "Explore Dining", icon: "link" }
  },
  amenities: { text: `Our amenities include ${HOTEL_KNOWLEDGE.amenities.slice(0, 8).join(", ")}, and more.` },
  location: {
    text: `${HOTEL_INFO.address}. We are 2 km from Hitec City.`,
    action: { type: "link", url: "/contact", label: "View on Map", icon: "link" }
  },
  booking: {
    text: "I can help you start a room booking right away.",
    action: { type: "book", label: "Start Booking", icon: "book" }
  },
  contact: {
    text: `You can reach our concierge immediately at ${HOTEL_INFO.phone}.`,
    action: { type: "call", phone: "+919642325555", label: "Call Concierge", icon: "call" }
  },
  attractions: { text: `Nearby places guests often visit include ${ATTRACTIONS.map((item) => item.name).join(", ")}.` },
  checkout: { text: "Our standard check-out time is 11:00 AM, though the front desk can help with late check-out requests when availability allows." },
  checkin: { text: "Our standard check-in time is 2:00 PM. If you arrive earlier, the team will assist based on room readiness." },
  thanks: { text: "It is a pleasure. If you want, I can also help you start a booking right away." },
  bye: { text: "Thank you for visiting Bael Tree Hotels. We look forward to hosting you." },
};

const resolveIntent = (text) => {
  const normalized = text.toLowerCase();
  return Object.entries(INTENTS).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  )?.[0];
};

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || defaultMessages;
    } catch {
      return defaultMessages;
    }
  });
  const { openBooking } = useBooking();

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendBotMessage = (content, action = null) => {
    setTyping(true);
    window.setTimeout(() => {
      setMessages((previous) => [
        ...previous,
        { id: crypto.randomUUID(), author: "bot", content, action },
      ]);
      setTyping(false);
    }, 800);
  };

  const handleUserMessage = (messageText) => {
    const trimmed = messageText.trim();
    if (!trimmed) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), author: "user", content: trimmed },
    ]);
    setInputValue("");

    if (trimmed.toLowerCase().includes("book")) {
      sendBotMessage("I can help you start a room booking right away.", { type: "book", label: "Start Booking", icon: "book" });
      return;
    }

    const intent = resolveIntent(trimmed);
    const response = intentResponses[intent] || { text: "I can help with room prices, dining hours, bookings, directions, and contact details. Try asking about any of those." };
    sendBotMessage(response.text, response.action);
  };

  const quickReplies = useMemo(() => QUICK_REPLY_OPTIONS, []);

  return (
    <div className={`chatbot ${open ? "open" : ""}`}>
      {open && (
        <div className="chatbot__window">
          <div className="chatbot__header">
            <div>
              <strong>Bael Tree Concierge</strong>
              <small>Luxury stay assistant</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chatbot">
              <X size={18} />
            </button>
          </div>
          <div className="chatbot__messages">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot__message ${message.author}`}>
                <p style={{ margin: 0 }}>{message.content}</p>
                {message.action && (
                  <div style={{ marginTop: "0.75rem" }}>
                    {message.action.type === 'link' && (
                      <Link to={message.action.url} className="chatbot-action-btn" onClick={() => setOpen(false)}>
                        <LinkIcon size={14} />
                        {message.action.label}
                      </Link>
                    )}
                    {message.action.type === 'call' && (
                      <a href={`tel:${message.action.phone}`} className="chatbot-action-btn">
                        <PhoneCall size={14} />
                        {message.action.label}
                      </a>
                    )}
                    {message.action.type === 'book' && (
                      <button type="button" className="chatbot-action-btn" onClick={() => {
                        setOpen(false);
                        openBooking(ROOM_CATEGORIES[0]);
                      }}>
                        <CalendarCheck size={14} />
                        {message.action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {typing && <div className="chatbot__typing">...</div>}
          </div>
          <div className="chatbot__quick-replies">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleUserMessage(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
          <form
            className="chatbot__input"
            onSubmit={(event) => {
              event.preventDefault();
              handleUserMessage(inputValue);
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask about rooms, dining, or bookings..."
              aria-label="Ask the hotel chatbot"
            />
            <button type="submit" aria-label="Send message">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="chatbot__toggle"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Open hotel chatbot"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? (
          <X size={24} color="#faf8f5" />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.7rem", fontWeight: 700, color: "#faf8f5", letterSpacing: "-1px" }}>B</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.7rem", fontWeight: 700, color: "rgba(250,248,245,0.7)", marginLeft: "-5px" }}>T</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
