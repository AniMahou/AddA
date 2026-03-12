import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiSmile, FiX } from 'react-icons/fi';
import EmojiPicker from './EmojiPicker';
import { useTypingIndicator } from '../../hooks/useSocket';
import { debounce } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MessageInput = ({ 
  onSendMessage, 
  onTyping, 
  conversationId, 
  receiverId,
  disabled = false,
  replyTo = null,
  onCancelReply
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Typing indicator
  const handleTyping = useTypingIndicator(conversationId, receiverId);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Debounced typing handler
  const debouncedTyping = debounce(() => {
    if (message.trim()) {
      handleTyping();
      onTyping?.(true);
    }
  }, 500);

  const handleChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      debouncedTyping();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    const messageData = {
      receiverId,
      content: message.trim(),
      messageType: attachments.length > 0 ? 'file' : 'text',
      replyTo: replyTo?._id
    };

    // Handle attachments
    if (attachments.length > 0) {
      setIsUploading(true);
      try {
        // Upload files first
        const uploadPromises = attachments.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          // Call upload service here
          // const response = await uploadService.uploadFile(formData);
          // return response.data;
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        messageData.attachments = uploadedFiles;
      } catch (error) {
        toast.error('Failed to upload files');
        return;
      } finally {
        setIsUploading(false);
      }
    }

    onSendMessage(messageData);
    setMessage('');
    setAttachments([]);
    onCancelReply?.();
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Reply indicator */}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between bg-gray-50 p-2 rounded-lg">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Replying to:</p>
            <p className="text-sm truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
          {attachments.map((file, index) => (
            <div key={index} className="relative flex-shrink-0">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-2">
                  <FiPaperclip className="w-6 h-6 text-gray-400" />
                  <p className="text-xs truncate w-full text-center">{file.name}</p>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Emoji picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <FiSmile className="w-5 h-5 text-gray-500" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-10">
              <EmojiPicker onSelect={handleEmojiSelect} />
            </div>
          )}
        </div>

        {/* File attachment */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
          disabled={isUploading}
        >
          <FiPaperclip className="w-5 h-5 text-gray-500" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Message input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? 'Uploading...' : 'Type a message...'}
            disabled={disabled || isUploading}
            rows="1"
            className="w-full resize-none border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled || isUploading}
          className="p-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;