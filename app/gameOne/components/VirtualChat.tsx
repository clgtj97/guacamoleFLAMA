import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
interface User {
  id: string;
  name: string;
  avatar?: string;
  isClubMember?: boolean;
  isOnline?: boolean;
}

interface Message {
  id: string;
  user: User;
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'system';
  voiceUrl?: string;
  voiceDuration?: number;
  reactions: MessageReaction[];
  isPinned?: boolean;
  pinnedBy?: User;
  pinnedAt?: Date;
  replyTo?: Message; // New reply feature
}

interface MessageReaction {
  emoji: string;
  users: User[];
  count: number;
}

interface TypingUser {
  user: User;
  startTime: number;
}

interface VirtualChatProps {
  roomId: string;
  currentUser: User;
  height?: number;
  showHeader?: boolean;
  disableAutoScroll?: boolean;
  disableDemoMessages?: boolean;
  externalMessages?: Partial<Message>[];
  isMultiplayerConnected?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: () => void;
  onMessageSend?: (message: Partial<Message>) => void;
  onMessageReact?: (messageId: string, emoji: string) => void;
  onMessagePin?: (messageId: string) => void;
  onVoiceMessage?: (audioBlob: Blob) => Promise<string>;
}

// Emoji Picker Component - FIXED: Properly defined and exported
const EmojiPicker: React.FC<{
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}> = ({ onEmojiSelect, onClose, position = 'top' }) => {
  const emojiCategories = {
    "Reactions": ["👍", "👎", "❤️", "🔥", "🥰", "👏", "😄", "🤔", "🤯", "🎉"],
    "Sports": ["🏎️", "🚗", "🏁", "🥇", "⚡", "💨", "👑", "💪", "🚀", "⭐"],
    "Objects": ["📌", "🎤", "🔊", "💬", "👥", "🌟", "💎", "🏆", "📢", "🔔"]
  };

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className={`absolute ${
        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      } left-0 bg-gray-800 border border-red-500/30 rounded-xl shadow-2xl p-3 w-64 z-50 backdrop-blur-sm`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-sm font-bold">Add Reaction</span>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg transition-colors"
        >
          ×
        </button>
      </div>
      
      {Object.entries(emojiCategories).map(([category, emojis]) => (
        <div key={category} className="mb-3">
          <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">
            {category}
          </div>
          <div className="grid grid-cols-5 gap-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onEmojiSelect(emoji)}
                className="text-xl hover:scale-125 transform transition-transform duration-150 p-1 rounded-lg hover:bg-red-500/20 active:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Voice Recorder Component
const VoiceRecorder: React.FC<{
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder>();
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access is required for voice messages. Please allow microphone permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setAudioLevel(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-red-500/30 rounded-xl shadow-2xl p-4 w-72 z-50 backdrop-blur-sm">
      {!isRecording ? (
        <div className="text-center">
          <div className="text-white text-sm font-semibold mb-3">
            Record Voice Message
          </div>
          <div className="flex gap-2">
            <button
              onClick={startRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              🎤 Start Recording
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors rounded-lg border border-gray-600 hover:border-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-400 text-sm font-semibold">
              {formatTime(recordingTime)}
            </span>
          </div>
          
          <div className="w-full h-4 bg-gray-700 rounded-full mb-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          
          <div className="text-white text-xs mb-3">
            Recording... Click stop when done
          </div>
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            ⏹️ Stop Recording
          </button>
        </div>
      )}
    </div>
  );
};

// Reply Preview Component
const ReplyPreview: React.FC<{
  message: Message;
  onCancel: () => void;
}> = ({ message, onCancel }) => {
  return (
    <div className="flex items-center justify-between bg-gray-800/50 border border-red-500/30 rounded-lg p-2 mb-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-red-400 text-xs">↪</span>
          <span className="text-red-300 text-xs font-semibold truncate">
            {message.user.name}
          </span>
        </div>
        <p className="text-gray-300 text-xs truncate">
          {message.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="text-gray-400 hover:text-red-400 ml-2 transition-colors"
        title="Cancel reply"
      >
        ×
      </button>
    </div>
  );
};

// Main Chat Component
const VirtualChat: React.FC<VirtualChatProps> = ({
  roomId,
  currentUser,
  height = 400,
  showHeader = true,
  disableAutoScroll = false,
  disableDemoMessages = false,
  externalMessages = [],
  isMultiplayerConnected = false,
  containerRef,
  onScroll,
  onMessageSend,
  onMessageReact,
  onMessagePin,
  onVoiceMessage,
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null); // New reply state

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Demo typing users simulation
  useEffect(() => {
    const demoUsers: User[] = [
      { id: 'enzo', name: 'Enzo Ferrari', isClubMember: true },
      { id: 'carlos', name: 'Carlos Sainz', isClubMember: true },
      { id: 'charles', name: 'Charles Leclerc', isClubMember: true },
      { id: 'fan1', name: 'Tifosi Fan', isClubMember: false }
    ];

    const typingInterval = setInterval(() => {
      if (Math.random() > 0.7 && typingUsers.length < 2) {
        const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
        const isAlreadyTyping = typingUsers.find(u => u.user.id === randomUser.id);
        
        if (!isAlreadyTyping) {
          setTypingUsers(prev => [...prev, { user: randomUser, startTime: Date.now() }]);
          
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.user.id !== randomUser.id));
          }, 2000 + Math.random() * 2000);
        }
      }
    }, 3000);

    return () => clearInterval(typingInterval);
  }, [typingUsers.length]);

  // Load initial messages
  useEffect(() => {
    if (disableDemoMessages) {
      setMessages([]);
      setPinnedMessage(null);
      return;
    }

    const demoMessages: Message[] = [
      {
        id: uuidv4(),
        user: { id: 'ferrari-official', name: 'Ferrari Official', isClubMember: true },
        content: 'Welcome to Ferrari Chat! 🏎️ Start your engines and join the conversation!',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text',
        reactions: [
          { emoji: '❤️', users: [currentUser], count: 1 },
          { emoji: '🏎️', users: [], count: 3 }
        ],
        isPinned: true,
        pinnedBy: { id: 'ferrari-official', name: 'Ferrari Official' },
        pinnedAt: new Date(Date.now() - 3500000)
      },
      {
        id: uuidv4(),
        user: { id: 'enzo-racer', name: 'Enzo Racer', isClubMember: true },
        content: 'Just completed the Pista challenge! What an amazing experience! 🚀',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text',
        reactions: [
          { emoji: '🔥', users: [], count: 2 },
          { emoji: '👏', users: [currentUser], count: 1 }
        ]
      },
      {
        id: uuidv4(),
        user: { id: 'speed-demon', name: 'Speed Demon', isClubMember: false },
        content: 'Can anyone help me with the racing line in the final corner?',
        timestamp: new Date(Date.now() - 900000),
        type: 'text',
        reactions: []
      }
    ];

    setMessages(demoMessages);
    setPinnedMessage(demoMessages[0]);
  }, [currentUser, disableDemoMessages]);

  // Merge external incoming messages (from multiplayer backend)
  useEffect(() => {
    if (!externalMessages.length) return;

    setMessages((prev) => {
      const existing = new Set(prev.map((m) => m.id));

      const incoming: Message[] = externalMessages
        .filter((message) => Boolean(message.id) && !existing.has(String(message.id)))
        .map((message) => ({
          id: String(message.id),
          user: {
            id: String(message.user?.id || 'system'),
            name: String(message.user?.name || 'System'),
            isClubMember: Boolean(message.user?.isClubMember),
            isOnline: true,
          },
          content: String(message.content || ''),
          timestamp: message.timestamp instanceof Date
            ? message.timestamp
            : new Date(message.timestamp || Date.now()),
          type: (message.type as Message['type']) || 'text',
          reactions: Array.isArray(message.reactions) ? message.reactions : [],
        }));

      if (incoming.length === 0) return prev;
      return [...prev, ...incoming];
    });
  }, [externalMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (disableAutoScroll) return;
    scrollToBottom();
  }, [messages, disableAutoScroll]);

  // Auto-scroll when typing indicators change
  useEffect(() => {
    if (disableAutoScroll) return;
    if (typingUsers.length > 0) {
      scrollToBottom();
    }
  }, [typingUsers, disableAutoScroll]);

  // Message Actions
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: uuidv4(),
      user: currentUser,
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text',
      reactions: [],
      replyTo: replyingTo || undefined // Include reply reference
    };

    if (!isMultiplayerConnected) {
      setMessages(prev => [...prev, newMessage]);
    }
    setInputMessage('');
    setReplyingTo(null); // Clear reply after sending
    onMessageSend?.(newMessage);
    stopTyping();
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    setIsUploading(true);
    try {
      let voiceUrl = '';
      
      if (onVoiceMessage) {
        voiceUrl = await onVoiceMessage(audioBlob);
      } else {
        voiceUrl = URL.createObjectURL(audioBlob);
      }

      const voiceMessage: Message = {
        id: uuidv4(),
        user: currentUser,
        content: 'Voice message',
        timestamp: new Date(),
        type: 'voice',
        voiceUrl,
        voiceDuration: Math.ceil(audioBlob.size / 5000),
        reactions: [],
        replyTo: replyingTo || undefined
      };

      if (!isMultiplayerConnected) {
        setMessages(prev => [...prev, voiceMessage]);
      }
      onMessageSend?.(voiceMessage);
      setReplyingTo(null); // Clear reply after sending

    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to send voice message. Please try again.');
    } finally {
      setIsUploading(false);
      setShowVoiceRecorder(false);
    }
  };

  const handleReactToMessage = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          const hasUserReacted = existingReaction.users.some(u => u.id === currentUser.id);
          if (hasUserReacted) {
            return {
              ...msg,
              reactions: msg.reactions.map(r =>
                r.emoji === emoji
                  ? { 
                      ...r, 
                      users: r.users.filter(u => u.id !== currentUser.id),
                      count: Math.max(0, r.count - 1)
                    }
                  : r
              ).filter(r => r.count > 0)
            };
          } else {
            return {
              ...msg,
              reactions: msg.reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, users: [...r.users, currentUser], count: r.count + 1 }
                  : r
              )
            };
          }
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, users: [currentUser], count: 1 }]
          };
        }
      }
      return msg;
    }));
    
    onMessageReact?.(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const handlePinMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      if (pinnedMessage?.id === messageId) {
        setPinnedMessage(null);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPinned: false } : msg
        ));
      } else {
        const pinnedMessageWithTimestamp = {
          ...message,
          isPinned: true,
          pinnedBy: currentUser,
          pinnedAt: new Date()
        };
        
        setPinnedMessage(pinnedMessageWithTimestamp);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? pinnedMessageWithTimestamp
            : { ...msg, isPinned: false }
        ));
      }
      onMessagePin?.(messageId);
    }
  };

  // New reply functionality
  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Typing Handlers
  const startTyping = () => {
    console.log('User started typing');
  };

  const stopTyping = () => {
    console.log('User stopped typing');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    if (e.target.value.trim()) {
      startTyping();
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  // UI Helpers
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'nearest'
    });
  };

  const getTypingIndicatorText = () => {
    if (typingUsers.length === 0) return null;
    const names = typingUsers.map(u => u.user.name);
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are typing...`;
  };

  const formatTime = (timestamp: Date | undefined | null): string => {
    if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      return 'Just now';
    }
    
    try {
      return timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Just now';
    }
  };

  const getRandomTypingAnimation = (index: number) => {
    const animations = ['animate-bounce', 'animate-pulse', 'animate-ping'];
    return animations[index % animations.length];
  };

  return (
    <div 
      className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-red-500/30 rounded-xl shadow-2xl flex flex-col backdrop-blur-sm transform transition-all duration-500 hover:shadow-red-500/20"
      style={{ height: `${height}px` }}
    >
      {/* Header */}
      {showHeader && (
        <div className="p-3 border-b border-red-500/30 bg-gradient-to-r from-red-900/50 to-gray-900/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-pulse"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <h3 className="font-bold text-white text-base font-['Bebas_Neue'] tracking-wider">
                FERRARI CHAT
              </h3>
              <span className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded-full border border-gray-600/30">
                #{roomId}
              </span>
            </div>
            <div className="text-xs text-red-300 font-['Zalando_Sans_SemiExpanded']">
              {messages.length} messages
            </div>
          </div>

          {/* Pinned Message */}
          {pinnedMessage && (
            <div className="mt-2 p-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-yellow-400 text-xs">📌</span>
                    <span className="text-yellow-300 text-xs font-semibold truncate">
                      {pinnedMessage.user.name}
                    </span>
                    <span className="text-yellow-500/70 text-xs">
                      {formatTime(pinnedMessage.pinnedAt)}
                    </span>
                  </div>
                  <p className="text-yellow-200 text-xs truncate">
                    {pinnedMessage.content}
                  </p>
                </div>
                <button
                  onClick={() => handlePinMessage(pinnedMessage.id)}
                  className="text-yellow-400 hover:text-yellow-300 ml-1 transition-colors transform hover:scale-110 text-xs"
                  title="Unpin message"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={containerRef || messagesContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-red-500/30 scrollbar-track-transparent hover:scrollbar-thumb-red-500/50"
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`p-2 rounded-lg border backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
              message.isPinned
                ? 'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20'
                : message.user.isClubMember
                ? 'bg-red-900/20 border-red-500/30 hover:shadow-red-500/10'
                : 'bg-gray-800/30 border-gray-600/30 hover:shadow-gray-500/10'
            } ${message.id === showEmojiPicker ? 'ring-1 ring-red-500/50 scale-[1.02]' : ''}`}
          >
            {/* Reply Preview */}
            {message.replyTo && (
              <div className="mb-1 p-1.5 bg-gray-800/40 rounded border-l-2 border-red-500/50">
                <div className="flex items-center space-x-1.5">
                  <span className="text-red-400 text-xs">↪</span>
                  <span className="text-red-300 text-xs font-medium truncate">
                    {message.replyTo.user.name}
                  </span>
                </div>
                <p className="text-gray-300 text-xs truncate mt-0.5">
                  {message.replyTo.content}
                </p>
              </div>
            )}

            {/* Message Header - Made more compact */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center space-x-1.5">
                {message.user.isClubMember && (
                  <span className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-800 text-white text-xs px-1.5 py-0.5 rounded-full border border-red-400/50">
                    🏎️
                  </span>
                )}
                <span className={`font-semibold text-xs ${
                  message.user.isClubMember ? 'text-yellow-300' : 'text-blue-400'
                } font-['Zalando_Sans_SemiExpanded']`}>
                  {message.user.name}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(message.timestamp)}
                </span>
                <button
                  onClick={() => handleReplyToMessage(message)}
                  className="text-gray-500 hover:text-green-400 transition-colors transform hover:scale-110 text-xs"
                  title="Reply to message"
                >
                  ↪
                </button>
                <button
                  onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors transform hover:scale-110 text-xs"
                  title="Add reaction"
                >
                  😊
                </button>
                {currentUser.isClubMember && (
                  <button
                    onClick={() => handlePinMessage(message.id)}
                    className="text-gray-500 hover:text-yellow-400 transition-colors transform hover:scale-110 text-xs"
                    title={message.isPinned ? "Unpin message" : "Pin message"}
                  >
                    {message.isPinned ? '📌' : '📍'}
                  </button>
                )}
              </div>
            </div>

            {/* Message Content */}
            {message.type === 'voice' ? (
              <div className="flex items-center space-x-2 bg-black/20 p-1.5 rounded-lg">
                <audio
                  controls
                  src={message.voiceUrl}
                  className="flex-1 h-6 bg-red-900/20 rounded-lg"
                />
                <span className="text-xs text-gray-400 bg-black/30 px-1.5 py-0.5 rounded-full">
                  {message.voiceDuration}s
                </span>
              </div>
            ) : (
              <p className="text-white text-sm leading-relaxed font-['Zalando_Sans_SemiExpanded']">
                {message.content}
              </p>
            )}

            {/* Reactions */}
            {message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {message.reactions.map((reaction, index) => (
                  <button
                    key={index}
                    onClick={() => handleReactToMessage(message.id, reaction.emoji)}
                    className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full border transition-all duration-200 hover:scale-105 text-xs ${
                      reaction.users.some(u => u.id === currentUser.id)
                        ? 'bg-red-500/30 border-red-500/50'
                        : 'bg-gray-700/50 border-gray-600/30 hover:bg-gray-600/50'
                    }`}
                  >
                    <span className="text-xs">{reaction.emoji}</span>
                    <span className="text-xs text-gray-300 font-medium">{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Emoji Picker - FIXED: Now properly defined */}
            {showEmojiPicker === message.id && (
              <EmojiPicker
                onEmojiSelect={(emoji) => handleReactToMessage(message.id, emoji)}
                onClose={() => setShowEmojiPicker(null)}
                position={index > messages.length - 3 ? 'bottom' : 'top'}
              />
            )}
          </div>
        ))}

        {/* Enhanced Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="p-2 rounded-lg bg-gray-800/30 border border-gray-600/30 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {typingUsers.map((typingUser, index) => (
                  <div 
                    key={typingUser.user.id}
                    className="flex items-center space-x-1"
                  >
                    <div className="flex space-x-0.5">
                      <div className={`w-1.5 h-1.5 bg-red-500 rounded-full ${getRandomTypingAnimation(index)}`}></div>
                      <div className={`w-1.5 h-1.5 bg-red-500 rounded-full ${getRandomTypingAnimation(index + 1)}`} style={{ animationDelay: '0.1s' }}></div>
                      <div className={`w-1.5 h-1.5 bg-red-500 rounded-full ${getRandomTypingAnimation(index + 2)}`} style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    {index < typingUsers.length - 1 && <span className="text-gray-400 mx-0.5">•</span>}
                  </div>
                ))}
              </div>
              <span className="text-gray-400 text-xs italic font-['Zalando_Sans_SemiExpanded']">
                {getTypingIndicatorText()}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-red-500/30 bg-gradient-to-r from-gray-900/80 to-black/80 relative">
        {/* Reply Preview */}
        {replyingTo && (
          <ReplyPreview 
            message={replyingTo} 
            onCancel={cancelReply}
          />
        )}
        
        <div className="flex gap-2">
          {/* Voice Message Button */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              disabled={isUploading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white p-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 border border-purple-400/30"
              title="Send voice message"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '🎤'
              )}
            </button>

            {showVoiceRecorder && (
              <VoiceRecorder
                onRecordingComplete={handleVoiceMessage}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={replyingTo ? `Replying to ${replyingTo.user.name}...` : "Type your message... 🏎️"}
              className="w-full bg-gray-800/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/30 border border-gray-600/30 backdrop-blur-sm transition-all duration-300 font-['Zalando_Sans_SemiExpanded'] placeholder-gray-400 hover:border-red-500/20"
              maxLength={500}
            />
            {inputMessage.length > 0 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="text-xs text-gray-400 bg-gray-900/80 px-1.5 py-0.5 rounded-full border border-gray-600/30">
                  {inputMessage.length}/500
                </div>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 border border-red-400/30 font-['Bebas_Neue'] tracking-wider"
          >
            SEND
          </button>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="flex justify-center space-x-3 mt-2">
          {[
            { emoji: '🏎️', label: 'Vroom!' },
            { emoji: '🚀', label: 'Fast!' },
            { emoji: '🔥', label: 'Hot!' },
            { emoji: '⭐', label: 'Star!' },
            { emoji: '🎯', label: 'Target!' },
            { emoji: '💫', label: 'Wow!' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setInputMessage(prev => prev + item.emoji);
                startTyping();
              }}
              className="text-sm transform transition-all duration-200 hover:scale-125 hover:text-red-400 active:scale-95 group relative"
              title={item.label}
            >
              {item.emoji}
              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualChat;