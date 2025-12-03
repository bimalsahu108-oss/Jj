import React from 'react';
import { MessageSquare, Plus, Trash2, Menu, X, Settings, HelpCircle, History } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-20 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-[#1E1F20] z-30 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full text-[#E3E3E3]">
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-[#333537] rounded-full"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-medium tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Jiksar
            </h1>
            <div className="w-8" /> {/* Spacer */}
          </div>

          {/* New Chat Button */}
          <div className="px-4 mb-4">
            <button
              onClick={() => {
                onNewChat();
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className="flex items-center gap-3 w-full bg-[#282A2C] hover:bg-[#333537] text-[#E3E3E3] py-3 px-4 rounded-full transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              <span className="truncate">New chat</span>
            </button>
          </div>

          {/* Recent List */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="px-4 py-2 text-xs font-medium text-gray-400">
              Recent
            </div>
            {sessions.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                No history yet.
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectChat(session.id);
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`group flex items-center gap-3 p-3 rounded-full cursor-pointer transition-colors text-sm mb-1 ${
                    session.id === currentSessionId
                      ? 'bg-[#004A77] text-blue-100'
                      : 'hover:bg-[#282A2C] text-gray-300'
                  }`}
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="truncate flex-1">{session.title}</span>
                  <button
                    onClick={(e) => onDeleteChat(session.id, e)}
                    className={`p-1.5 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${
                      session.id === currentSessionId ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-[#444746] mt-auto">
            <div className="flex flex-col gap-1">
              <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#282A2C] text-sm text-gray-300 transition-colors">
                <HelpCircle size={18} />
                Help
              </button>
              <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#282A2C] text-sm text-gray-300 transition-colors">
                <History size={18} />
                Activity
              </button>
              <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#282A2C] text-sm text-gray-300 transition-colors">
                <Settings size={18} />
                Settings
              </button>
              <div className="px-3 py-2 text-xs text-gray-500 mt-2">
                • San Jose, CA, USA
                <br />
                • From your IP address
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
