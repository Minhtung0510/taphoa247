'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

const QUICK_QUESTIONS = [
  {
    q: '⚡ Cách nhận hàng tự động 3 giây?',
    a: 'Dạ sau khi bạn quét mã VietQR TPBank đúng số tiền và cú pháp, hệ thống sẽ tự động xác nhận và cấp thông tin bản quyền (Key/TK:MK/Link) ngay trên màn hình sau 3 giây và gửi email cho bạn ạ!',
  },
  {
    q: '💻 Tư vấn gói Cursor AI Pro?',
    a: 'Dạ Cursor AI có 2 dòng: Gói Ngày (400 chat/ngày từ 35k - 299k) và Gói VIP Request Pool (30 ngày không giới hạn ngày từ 109k cho 700 req đến 769k cho 30.000 req). Lưu ý nhớ logout máy cũ trước khi đăng nhập máy mới nhé ạ!',
  },
  {
    q: '✨ Gemini Antigravity nâng chính chủ?',
    a: 'Dạ Gemini Antigravity Pro nâng trực tiếp vào email Google của bạn qua Family Group, bảo hành FULL thời hạn gói: 1 tháng (99k), 4 tháng (189k), 1 năm Team (329k), Ultra (499k) ạ!',
  },
  {
    q: '☁️ Google One 5TB chính chủ?',
    a: 'Dạ Google One 5TB nâng slot Family chính chủ vào tài khoản của bạn, chuẩn 5TB dung lượng lưu trữ Drive/Photos, bảo hành FULL 100% thời gian từ 1 tháng (55k) đến 12 tháng (329k) ạ!',
  },
  {
    q: '⚡ Thẻ nạp API Sub Credits?',
    a: 'Dạ thẻ credits nạp vào cổng API Sub Credits để gọi Claude, Codex, DeepSeek, Grok, đặc biệt là KHÔNG GIỚI HẠN THỜI HẠN (dùng vĩnh viễn), giá từ 22k ($20) đến 1.090k ($1,000) ạ!',
  },
  {
    q: '🛡️ Chính sách bảo hành các gói?',
    a: 'Dạ mọi sản phẩm đều có chính sách bảo hành rõ ràng: Cursor & Google One bảo hành theo hạn gói, SubAPI bảo hành mã nạp vĩnh viễn, Muse AI bảo hành 24h, Valorant bảo hành 2h - 5h Chủ Off 1 đổi 1 tức thì ạ!',
  },
];

export function AiGamingMascot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hí bạn ơi! Em là Yến - Tư Vấn Viên của TẠP HÓA 247 🎧✨. Em trực tự động 24/7 để tư vấn chi tiết các gói Cursor AI, Gemini Antigravity, Google One 5TB, SubAPI, tài khoản Game và hỗ trợ bảo hành nhé!',
      time: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Listen to custom event to open chat from any button on the site
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setShowGreeting(false);
    };
    window.addEventListener('open-ai-chat', handleOpenChat);

    // Tự động đóng bong bóng chào sau 8 giây để không che chữ trên màn hình
    const timer = setTimeout(() => {
      setShowGreeting(false);
    }, 8000);

    return () => {
      window.removeEventListener('open-ai-chat', handleOpenChat);
      clearTimeout(timer);
    };
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleAsk = (question: string, answer: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: answer,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const text = inputText.trim();
    setInputText('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply || 'Dạ em là Yến - Tư Vấn Viên của Tạp Hóa 247! Bạn có thể chọn sản phẩm ở danh mục bên dưới để quét mã VietQR tự động nhé ạ!';

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Local fallback in case of connection issue
      const lower = text.toLowerCase();
      let fallbackReply = 'Dạ em là Yến - Tư Vấn Viên của Tạp Hóa 247! Hệ thống shop hoạt động tự động 24/7. Bạn có thể chọn sản phẩm ở danh mục bên dưới, bấm "Mua Ngay" và quét mã VietQR để nhận đơn sau 3 giây nhé ạ!';
      if (lower.includes('cursor')) {
        fallbackReply = 'Dạ Cursor AI Pro bên em có gói ngày (từ 35k) và gói VIP Request Pool không giới hạn ngày (từ 109k). Bàn giao key extension tự động và nhớ logout máy cũ trước khi đăng nhập máy mới nhé ạ!';
      } else if (lower.includes('antigravity') || lower.includes('gemini')) {
        fallbackReply = 'Dạ Gemini Antigravity nâng chính chủ Google Family 1 tháng 99k, 4 tháng 189k, 1 năm Team 329k, bảo hành FULL 100% thời hạn gói ạ!';
      } else if (lower.includes('google one') || lower.includes('5tb')) {
        fallbackReply = 'Dạ Google One 5TB nâng chính chủ từ 55k/tháng hoặc 329k/năm, chuẩn 5TB Drive/Photos/Gmail, bảo hành FULL 100% ạ!';
      } else if (lower.includes('subapi') || lower.includes('claude') || lower.includes('credit')) {
        fallbackReply = 'Dạ API Sub Credits nạp vào cổng API Sub Credits để gọi Claude, Codex, DeepSeek, Grok, không giới hạn thời gian (dùng vĩnh viễn), giá từ 22k ($20) nhé ạ!';
      } else if (lower.includes('bảo hành') || lower.includes('lỗi') || lower.includes('sai pass')) {
        fallbackReply = 'Dạ mọi sản phẩm đều có chính sách bảo hành rõ ràng: Cursor & Google One bảo hành theo hạn gói, SubAPI bảo hành mã nạp vĩnh viễn, Muse AI bảo hành 24h, Valorant bảo hành 2h - 5h Chủ Off. Bạn vào mục "Bảo Hành" trên menu là đổi mới tức thì ạ!';
      } else if (lower.includes('nhận acc') || lower.includes('bao lâu') || lower.includes('thời gian')) {
        fallbackReply = 'Sau khi chuyển khoản VietQR đúng số tiền và mã đơn, hệ thống SePay tự động khớp lệnh và cấp thông tin bản quyền trên màn hình chỉ sau 3 giây!';
      } else if (lower.includes('hotline') || lower.includes('zalo') || lower.includes('admin') || lower.includes('sđt') || lower.includes('nhóm')) {
        fallbackReply = 'Bạn tham gia ngay Nhóm Cộng Đồng Zalo của shop tại https://zalo.me/g/ovxv2lnx8zvdw8f6q6qb hoặc Telegram @dtffshop để được kỹ thuật viên hỗ trợ nhanh nhé ạ!';
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackReply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none font-sans">
      
      {/* ══════════════════════════════════════════════════════════
          COLLAPSED STATE: FLOATING CIRCULAR BOT MASCOT
         ══════════════════════════════════════════════════════════ */}
      {!isOpen && (
        <div className="relative flex items-center justify-end">
          
          {/* CUTE SPEECH BUBBLE POPUP (DESKTOP: FLOATING TO THE LEFT) */}
          {showGreeting && (
            <div className="hidden sm:block absolute right-[76px] top-1/2 -translate-y-1/2 w-[270px] animate-in fade-in slide-in-from-right-4 duration-300">
              <div
                onClick={() => {
                  setIsOpen(true);
                  setShowGreeting(false);
                }}
                className="relative p-3.5 rounded-2xl bg-[#0b101e] border border-[#00e5a0]/60 shadow-[0_12px_35px_rgba(0,0,0,0.95)] cursor-pointer group hover:border-[#00e5a0] transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">👩‍💼</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-[#00e5a0] transition-colors">
                        Em Yến Tư Vấn 24/7
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#00e5a0]/20 text-[#00e5a0] font-mono font-bold shrink-0">
                        ONLINE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-snug break-words">
                      Cần tư vấn gói Cursor AI, Antigravity hay Game cứ nhắn em nha ~ ✨
                    </div>
                    <div className="text-[10px] text-[#00e5a0] font-mono mt-1.5 font-semibold flex items-center gap-1">
                      <span>⚡ Bấm để chat ngay</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>

                  {/* Dismiss X button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGreeting(false);
                    }}
                    className="w-5 h-5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors -mr-1 -mt-1 text-sm font-bold cursor-pointer shrink-0"
                    title="Đóng lời chào"
                  >
                    ×
                  </button>
                </div>

                {/* Speech Bubble Arrow pointing right to the mascot */}
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#0b101e] border-t border-r border-[#00e5a0]/60 rotate-45" />
              </div>
            </div>
          )}

          {/* CUTE SPEECH BUBBLE POPUP (MOBILE: FLOATING ABOVE) */}
          {showGreeting && (
            <div className="sm:hidden absolute bottom-[72px] right-0 w-[240px] animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div
                onClick={() => {
                  setIsOpen(true);
                  setShowGreeting(false);
                }}
                className="relative p-3 rounded-2xl bg-[#0b101e] border border-[#00e5a0]/60 shadow-[0_12px_35px_rgba(0,0,0,0.95)] cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <span className="text-base">👩‍💼</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[11px] font-bold text-white">
                      Em Yến Tư Vấn 24/7
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5 break-words">
                      Bấm vào đây để chat với em nha ✨
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGreeting(false);
                    }}
                    className="text-slate-400 text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
                {/* Speech Bubble Arrow pointing down */}
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#0b101e] border-b border-r border-[#00e5a0]/60 rotate-45" />
              </div>
            </div>
          )}

          {/* MAIN CIRCULAR BUBBLE BUTTON */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setShowGreeting(false);
            }}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#00e5a0] via-[#00c4ff] to-[#7c3aed] p-[2.5px] shadow-2xl shadow-[#00e5a0]/30 hover:shadow-[#00e5a0]/60 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group shrink-0"
            title="Mở Em Yến Tư Vấn 24/7"
          >
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] opacity-50 blur-md group-hover:opacity-90 transition-opacity pointer-events-none" />
            <div className="w-full h-full bg-[#070c17] rounded-full overflow-hidden relative group-hover:brightness-110 transition-all flex items-center justify-center">
              <img
                src="/images/chatbot-avatar.png"
                alt="Em Yến Tư Vấn"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
              />
              {/* Online Green Ping Dot */}
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#00e5a0] rounded-full border-2 border-[#070c17] shadow-sm shadow-[#00e5a0]" />
            </div>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          EXPANDED STATE: FLOATING CHATBOX MODAL
         ══════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] sm:w-[390px] h-[530px] max-h-[85vh] rounded-3xl bg-[#090e1a]/95 border border-[#1e293b] shadow-2xl shadow-black/90 backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* CHAT HEADER */}
          <div className="px-4 py-3 bg-[#0d1527] border-b border-[#1e293b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00e5a0] to-[#00c4ff] p-0.5 flex items-center justify-center overflow-hidden">
                  <img
                    src="/images/chatbot-avatar.png"
                    alt="Em Yến Tư Vấn"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00e5a0] border-2 border-[#090e1a]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Em Yến Tư Vấn</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#00e5a0]/15 text-[#00e5a0] font-mono border border-[#00e5a0]/30">
                    24/7
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Trực tuyến • Tư vấn & Hỗ trợ
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#00e5a0] bg-[#00e5a0]/10 px-2 py-0.5 rounded-full border border-[#00e5a0]/20 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-ping" />
                <span>Auto 3s</span>
              </div>

              {/* Close / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Thu nhỏ chatbox"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs scroll-smooth"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.sender === 'ai' ? (
                  <div className="flex items-end gap-2 max-w-[90%]">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#00e5a0]/30 shadow-sm">
                      <img
                        src="/images/chatbot-avatar.png"
                        alt="Em Yến"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="bg-[#131b2e] text-slate-200 border border-[#1e293b] rounded-2xl rounded-bl-none px-3.5 py-2.5 leading-relaxed shadow-sm">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-semibold rounded-br-none shadow-md shadow-[#00e5a0]/10">
                    {m.text}
                  </div>
                )}
                <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#00e5a0]/30 shadow-sm">
                  <img
                    src="/images/chatbot-avatar.png"
                    alt="Em Yến"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-1 bg-[#131b2e] border border-[#1e293b] text-slate-400 px-3 py-2 rounded-2xl rounded-bl-none w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* QUICK QUESTION CHIPS */}
          <div className="px-3 py-2 bg-[#080d18] border-t border-[#1e293b]/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(item.q, item.a)}
                className="px-2.5 py-1 rounded-lg bg-[#111827] hover:bg-[#1a2338] text-slate-300 hover:text-white border border-[#1e293b] text-[10px] font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer"
              >
                {item.q}
              </button>
            ))}
          </div>

          {/* CHAT INPUT BAR */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-[#0a101f] border-t border-[#1e293b] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Hỏi Em Yến về sản phẩm, giá, bảo hành..."
              className="flex-1 bg-[#131c30] border border-[#22304d] hover:border-slate-600 focus:border-[#00e5a0] text-white text-xs px-3 py-2 rounded-xl outline-none transition-all placeholder:text-slate-500 font-sans"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:brightness-110 active:scale-95 disabled:opacity-50 text-[#050a14] font-black text-xs transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Gửi câu hỏi"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
