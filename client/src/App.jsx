import React from 'react';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                AddA
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Home</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">About</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                Login
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-md">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Chat Smarter with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AddA
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Experience real-time messaging with AI-powered features. Connect, share, and communicate like never before.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-600 text-xl">💬</span>
                </div>
                <h3 className="font-semibold text-gray-800">Real-time Chat</h3>
                <p className="text-sm text-gray-600">Instant messaging with typing indicators</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-purple-600 text-xl">🤖</span>
                </div>
                <h3 className="font-semibold text-gray-800">AI Powered</h3>
                <p className="text-sm text-gray-600">Smart replies & sentiment analysis</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-green-600 text-xl">👥</span>
                </div>
                <h3 className="font-semibold text-gray-800">Friend System</h3>
                <p className="text-sm text-gray-600">Connect with people you know</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-orange-600 text-xl">📎</span>
                </div>
                <h3 className="font-semibold text-gray-800">File Sharing</h3>
                <p className="text-sm text-gray-600">Share images and documents</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2">
                Get Started
                <span className="text-lg">→</span>
              </button>
              <button className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-200">
                Learn More
              </button>
            </div>
          </div>

          {/* Right Image Placeholder */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6">
                {/* Chat Preview */}
                <div className="space-y-4">
                  {/* Message 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      J
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] shadow">
                      <p className="text-gray-800">Hey! How's it going?</p>
                      <span className="text-xs text-gray-500">2 min ago</span>
                    </div>
                  </div>

                  {/* Message 2 */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-purple-500 rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%] shadow">
                      <p className="text-white">Great! Just testing AddA's features 🚀</p>
                      <span className="text-xs text-purple-200">1 min ago</span>
                    </div>
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      A
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    <div className="flex gap-1 bg-white rounded-full px-4 py-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white mt-16 py-8 border-t">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 AddA. All rights reserved. Built with 💙 in Bangladesh</p>
        </div>
      </footer>
    </div>
  );
}

export default App;