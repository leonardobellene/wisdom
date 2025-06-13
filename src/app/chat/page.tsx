'use client';
import { useState, useEffect, useRef } from 'react';
import ChatHeader from '@/app/components/ChatHeader';
import MessageList from '@/app/components/MessageList';
import ChatInput from '@/app/components/ChatInput';
import { getUserInfo, isAllowedToChat } from '@/app/lib/storage';
import { getWelcomeMessage } from '@/app/utils/messages';

type Message = {
  role: 'user' | 'eugene';
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const hasStartedStreamingRef = useRef(false); // useRef instead of useState

  useEffect(() => {
    const { username, language } = getUserInfo();
    const allowed = isAllowedToChat();

    if (!username || !allowed) {
      window.location.replace('/');
    } else {
      const welcomeMessage = getWelcomeMessage(language, username);
      setMessages([{ role: 'eugene', content: welcomeMessage }]);
      setLoading(false);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const { username = 'Seeker', gender, language } = getUserInfo();
    const newUserMessage: Message = { role: 'user', content: input };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsThinking(true);

    try {
      // Remove welcome message
      const filteredMessages = [...messages, newUserMessage].filter((msg, idx) => {
        return !(idx === 0 && msg.role === 'eugene');
      });

      // Format messages for OpenAI API
      const formattedMessages = filteredMessages.map((msg) => ({
        role: msg.role === 'eugene' ? 'assistant' : 'user',
        content: msg.content,
      }));

      // Limit to last 14 messages
      const lastMessages = formattedMessages.slice(-14);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          gender,
          language,
          messages: lastMessages,
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      hasStartedStreamingRef.current = false; // reset at start

      let partial = '';
      const newEugeneMessage: Message = { role: 'eugene', content: '' };
      setMessages((prev) => [...prev, newEugeneMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const lines = value.split('\n').filter(Boolean);

        for (const line of lines) {
          if (line.startsWith('0:')) {
            if (!hasStartedStreamingRef.current) {
              hasStartedStreamingRef.current = true;
            }
            try {
              const token = JSON.parse(line.slice(2));
              partial += token;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: partial,
                };
                return updated;
              });
            } catch (err) {
              console.error('JSON parse error:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('OpenAI error:', err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'eugene',
          content: '🧘 Something went wrong. Try again soon.',
        },
      ]);
    }

    hasStartedStreamingRef.current = false; 
    setIsThinking(false);
  };

  if (loading) return null;

  return (
    <div className="flex flex-col h-screen text-gray-100">
      <ChatHeader />
      <MessageList
        messages={messages}
        isThinking={isThinking}
        hasStartedStreaming={hasStartedStreamingRef.current}
      />
      <ChatInput value={input} onChange={setInput} onSend={sendMessage} isThinking={isThinking} />
    </div>
  );
}
