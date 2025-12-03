import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Copy, ThumbsUp, ThumbsDown, RotateCw, ExternalLink } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 w-full max-w-4xl mx-auto p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar (Model Only) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-pink-900/20">
          <span className="text-white text-xs font-bold font-sans">J</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* User Name */}
        {isUser && (
           <div className="flex items-center gap-2 mb-1">
             <span className="text-sm font-medium text-gray-300">You</span>
             <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User size={18} className="text-white" />
             </div>
           </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap justify-end">
            {message.attachments.map((att, idx) => (
              <img
                key={idx}
                src={`data:${att.mimeType};base64,${att.data}`}
                alt="attachment"
                className="h-48 w-auto rounded-xl border border-gray-700 object-cover"
              />
            ))}
          </div>
        )}

        {/* Content Bubble */}
        <div className={`relative text-base leading-relaxed ${
          isUser 
            ? 'text-white' 
            : 'text-gray-100 w-full'
        }`}>
          {isUser ? (
             <div className="bg-[#282A2C] px-5 py-3 rounded-3xl rounded-tr-sm text-gray-100">
               {message.content}
             </div>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:leading-7 prose-pre:bg-[#1E1F20] prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <div className="relative group">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">{match[1]}</span>
                        </div>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    ) : (
                      <code className={`${className} bg-gray-800 px-1 py-0.5 rounded text-sm`} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Grounding Sources (Search Results) */}
        {!isUser && message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.groundingMetadata.groundingChunks.map((chunk, idx) => {
               if (chunk.web?.uri) {
                 return (
                   <a 
                     key={idx} 
                     href={chunk.web.uri}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 bg-[#282A2C] hover:bg-[#333537] px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors border border-gray-700"
                   >
                     <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center text-[10px]">
                        {idx + 1}
                     </div>
                     <span className="truncate max-w-[150px]">{chunk.web.title || chunk.web.uri}</span>
                     <ExternalLink size={12} className="text-gray-500" />
                   </a>
                 )
               }
               return null;
            })}
          </div>
        )}

        {/* Action Buttons (Model Only) */}
        {!isUser && !isStreaming && (
          <div className="flex items-center gap-1 mt-2 text-gray-400">
            <button className="p-2 hover:bg-[#282A2C] rounded-full transition-colors" title="Good response">
              <ThumbsUp size={16} />
            </button>
            <button className="p-2 hover:bg-[#282A2C] rounded-full transition-colors" title="Bad response">
              <ThumbsDown size={16} />
            </button>
            <button className="p-2 hover:bg-[#282A2C] rounded-full transition-colors" title="Copy text">
              <Copy size={16} />
            </button>
            <button className="p-2 hover:bg-[#282A2C] rounded-full transition-colors" title="Regenerate">
              <RotateCw size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;