import React from 'react';

const TypingIndicator = ({ name }) => {
  return (
    <div className="flex items-start mb-4">
      <div className="flex-shrink-0 mr-2">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
        {name && (
          <p className="text-xs text-gray-600 mb-1">{name} is typing</p>
        )}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;