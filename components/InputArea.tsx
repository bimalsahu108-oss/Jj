import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, X, Globe, Loader2, StopCircle } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[], useSearch: boolean) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useSearch, setUseSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setText(prev => {
            const newText = prev + (prev ? ' ' : '') + transcript;
            return newText;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, attachments, useSearch);
    setText('');
    setAttachments([]);
    // Height reset handled by useEffect
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          mimeType: file.type,
          data: base64String
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <div className={`bg-[#1E1F20] rounded-[28px] p-2 relative shadow-lg border transition-colors ${isListening ? 'border-red-500/50 shadow-red-900/20' : 'border-[#444746]/50 focus-within:border-[#A8C7FA]/50'}`}>
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-3 px-3 pt-3 pb-1 overflow-x-auto">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img 
                  src={`data:${att.mimeType};base64,${att.data}`} 
                  alt="preview" 
                  className="w-16 h-16 object-cover rounded-lg border border-gray-600" 
                />
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1 -right-1 bg-gray-800 text-gray-300 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-2">
          {/* Add Image Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-gray-200 hover:bg-[#333537] rounded-full transition-colors mb-1"
            title="Upload image"
          >
            <ImageIcon size={20} />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />
          </button>

           {/* Search Toggle */}
           <button 
            onClick={() => setUseSearch(!useSearch)}
            className={`p-3 rounded-full transition-colors mb-1 flex items-center justify-center ${
              useSearch 
                ? 'bg-blue-900/30 text-blue-400' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#333537]'
            }`}
            title="Toggle Search Grounding"
          >
            <Globe size={20} />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask Jiksar..."}
            className="w-full bg-transparent text-lg text-gray-200 placeholder-gray-500 resize-none outline-none py-3.5 max-h-[200px] overflow-y-auto font-light"
            rows={1}
          />

          {/* Mic / Send Button */}
          {text.trim() || attachments.length > 0 ? (
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`p-3 mb-1 rounded-full transition-all duration-200 ${
                isLoading 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-[#E3E3E3] text-black hover:bg-white'
              }`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
            </button>
          ) : (
             <button
              onClick={toggleMic}
              className={`p-3 mb-1 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500/20 text-red-400 animate-pulse' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#333537]'
              }`}
              title={isListening ? "Stop listening" : "Turn on microphone"}
             >
               {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
             </button>
          )}
        </div>
      </div>
      <div className="text-center mt-2">
        <p className="text-[11px] text-gray-500">
          Jiksar may display inaccurate info, including about people, so double-check its responses.
        </p>
      </div>
    </div>
  );
};

export default InputArea;