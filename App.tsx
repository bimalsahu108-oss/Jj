import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { geminiService } from './services/geminiService';
import { ChatSession, Message, Attachment } from './types';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a default session on load
  useEffect(() => {
    const defaultSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions([defaultSession]);
    setCurrentSessionId(defaultSession.id);
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(sessions.length > 1 ? sessions[0].id : null);
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[], useSearch: boolean) => {
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachments,
      timestamp: Date.now()
    };

    // Optimistically update UI
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Update title if it's the first message
        const newTitle = session.messages.length === 0 ? (text.slice(0, 30) || 'Image Query') : session.title;
        return {
          ...session,
          title: newTitle,
          messages: [...session.messages, userMessage],
          updatedAt: Date.now()
        };
      }
      return session;
    }));

    setIsLoading(true);

    try {
      // Create a placeholder for AI response
      const aiMessageId = crypto.randomUUID();
      const aiPlaceholder: Message = {
        id: aiMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, aiPlaceholder]
          };
        }
        return session;
      }));

      // Stream Response
      const stream = geminiService.streamChatResponse(
        messages, 
        text,
        attachments,
        useSearch
      );

      let accumulatedText = '';
      let groundingMetadata = undefined;

      for await (const chunk of stream) {
        if (chunk.text) {
          accumulatedText += chunk.text;
        }
        if (chunk.groundingMetadata) {
            groundingMetadata = chunk.groundingMetadata;
        }

        setSessions(prev => prev.map(session => {
          if (session.id === currentSessionId) {
            const updatedMessages = session.messages.map(msg => {
              if (msg.id === aiMessageId) {
                return { ...msg, content: accumulatedText, groundingMetadata: groundingMetadata || msg.groundingMetadata };
              }
              return msg;
            });
            return { ...session, messages: updatedMessages };
          }
          return session;
        }));
      }

    } catch (error) {
      console.error("Chat Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#131314] text-white overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId || ''}
        onNewChat={handleNewChat}
        onSelectChat={setCurrentSessionId}
        onDeleteChat={handleDeleteChat}
      />

      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-[#131314] sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 hover:bg-[#282A2C] rounded-full text-gray-400 lg:hidden"
             >
               <Menu size={20} />
             </button>
             <button className="flex items-center gap-2 text-lg text-gray-200 font-medium hover:bg-[#1E1F20] px-3 py-1.5 rounded-lg transition-colors">
               <span>Jiksar</span>
               <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-50 rotate-90"><path d="M8 5v14l11-7z"/></svg>
             </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-sm font-bold">
              J
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="mb-8">
                 <h1 className="text-5xl font-medium bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent mb-3 inline-block">
                   Hello! I'm Jiksar
                 </h1>
                 <p className="text-2xl text-gray-400 font-light">Would you like to turn the microphone on?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl w-full">
                {['Plan a trip', 'Write code', 'Analyze image', 'Explain quantum physics'].map((suggestion, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendMessage(suggestion, [], false)}
                    className="bg-[#1E1F20] hover:bg-[#282A2C] p-4 rounded-xl text-left transition-colors h-32 flex flex-col justify-between group border border-transparent hover:border-gray-600"
                  >
                    <span className="text-gray-300 group-hover:text-white font-medium">{suggestion}</span>
                    <div className="w-8 h-8 bg-[#131314] rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-6 pb-32">
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isStreaming={isLoading && msg.role === 'model' && msg === messages[messages.length - 1]}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area (Sticky) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pt-10">
           <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default App;