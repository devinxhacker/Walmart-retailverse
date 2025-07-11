import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

// Check for browser support for Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false; // Stop recording when user stops talking
  recognition.lang = 'en-US';
  recognition.interimResults = true; // Get results as the user speaks
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const initialMessage = { from: 'bot', text: 'Hello! How can I help you find the perfect product today?', id: 'initial' };

  // Load messages from localStorage on initial render, or use a default.
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages;
        }
      }
    } catch (error) {
      console.error("Failed to parse chat messages from localStorage", error);
    }
    // Default message if nothing is saved or if parsing fails.
    return [initialMessage];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const messagesEndRef = useRef(null);
  const micOnSound = useRef(new Audio('/audio/mic-on.mp3'));
  const micOffSound = useRef(new Audio('/audio/mic-off.mp3'));

  // Use a ref to get the latest conversation mode state inside async callbacks
  const conversationModeRef = useRef(isConversationMode);
  useEffect(() => { conversationModeRef.current = isConversationMode; }, [isConversationMode]);

  // Save messages to localStorage whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat messages to localStorage", error);
    }
  }, [messages]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Effect to handle speech recognition events
  useEffect(() => {
    if (!recognition) return;

    let finalTranscript = '';

    recognition.onstart = () => {
      finalTranscript = '';
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        handleSend(finalTranscript.trim());
      }
    };
  }, []);

  // Effect to load speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        setVoices(speechSynthesis.getVoices());
      };
      // The voices list is loaded asynchronously.
      speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices(); // For browsers that load them immediately.
    }
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleNewChat = () => {
    // Clear state, which will trigger the useEffect to update localStorage.
    setMessages([initialMessage]);
  };

   const handleToggleConversationMode = () => {
    if (isConversationMode) {
      micOffSound.current.play();
      recognition.stop();
      speechSynthesis.cancel();
      setIsConversationMode(false);
    } else {
      micOnSound.current.play();
      setInput('');
      recognition.start();
      setIsConversationMode(true);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window && text) {
      speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (conversationModeRef.current) {
          recognition.start(); // Listen again
        }
      };

      // Find a soft, female voice.
      // The names can vary wildly between browsers and OS.
      // Common names: "Susan", "Zira", "Google UK English Female"
      // Common names for Indian English: "Google Indian English Female"
      const femaleVoice = voices.find(
        (voice) =>
          voice.lang.startsWith('en-') &&
          (voice.name.includes('Female') ||
            voice.name.includes('Google UK English Female')||
            voice.name.includes('Google Indian English Female')||
            voice.name.includes('Zira') ||
            voice.name.includes('Susan')
            )
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.pitch = 1.1; // Slightly higher pitch for a softer tone
        utterance.rate = 1.1; // Normal speed
      }
      speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (queryText) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend) return;

    const userMessage = { from: 'user', text: textToSend, id: Date.now() };
    const botMessageId = Date.now() + 1;

    // Add user message and an empty bot message for the streaming response
    setMessages(prev => [...prev, userMessage, { from: 'bot', text: '', id: botMessageId }]);
    const currentHistory = [...messages, userMessage]; // History for context
    if (!queryText) setInput(''); // Clear input only if it was a manual send
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSend, history: currentHistory }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Update the bot message in state as chunks arrive
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessageId ? { ...msg, text: fullResponse } : msg
          )
        );
      }

      if (conversationModeRef.current) {
        speak(fullResponse);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = { from: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later.' };
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId ? { ...msg, ...errorMessage } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h2>RetailVerse Assistant</h2>
            <div className="header-buttons">
              <button onClick={handleNewChat} className="new-chat-btn" title="New Chat">🔄</button>
              <button onClick={toggleChat} className="close-btn" title="Close Chat">&times;</button>
            </div>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.from}`}>
                <span>{msg.text}</span>
                {msg.from === 'bot' && msg.text && 'speechSynthesis' in window && (
                  <button onClick={() => speak(msg.text)} className="speak-btn" title="Read aloud">
                    🔊
                  </button>
                )}
              </div>
            ))}
            {isLoading && <div className="message bot">...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask about products..."}
              disabled={isLoading || isListening || isSpeaking || isConversationMode}
            />
            {recognition && (
              <button onClick={handleToggleConversationMode} className={`mic-btn ${isConversationMode ? 'conversation-mode' : ''} ${isListening ? 'listening' : ''}`} title="Conversation Mode">
                🎤
              </button>
            )}
            <button onClick={() => handleSend()} disabled={isLoading || !input.trim() || isConversationMode}>Send</button>
          </div>
        </div>
      )}
      <button onClick={toggleChat} className="chat-toggle-btn">
        {isOpen ? 'Close' : 'Chat'}
      </button>
    </div>
  );
};

export default Chatbot;
