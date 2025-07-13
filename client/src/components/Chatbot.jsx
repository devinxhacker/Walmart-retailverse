import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import Groq from 'groq-sdk';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';
 
const groqClient = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    baseUrl: 'https://api.groq.io/v1',
    dangerouslyAllowBrowser: true
}
);




// Check for browser support for Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false; // Stop recording when user stops talking
  recognition.lang = 'en-US';
  recognition.interimResults = true; // Get results as the user speaks
}

const Chatbot = () => {
  const navigate = useNavigate();
  const { addToCart, removeItem: removeFromCartContext, clearCart: clearCartContext } = useCart();
  const { wishlist, toggleWishlist, clearWishlist: clearWishlistContext } = useWishlist();

  const [isOpen, setIsOpen] = useState(false);
  
  const initialMessage = { role: 'assistant', content: 'Hello! How can I help you find the perfect product today?', id:'initial'};

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

  const [message, setMessage] = useState('');
  // const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const messagesEndRef = useRef(null);
  const micOnSound = useRef(new Audio('/audio/mic-on.mp3'));
  const micOffSound = useRef(new Audio('/audio/mic-off.mp3'));
  const targetIdsRef = useRef('');

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








  async function executeCommand(command, args) {
    switch(command){
      case "view_product":
        console.log(`Performing view command with args: ${args.input}`)
        await view(args.input);
        break;
      case "do_nothing":
        console.log("No action taken.");
        break;
      case "send_to_cart":
        console.log("Sending to cart...");
        await sendToCart(args.input);
        break;
      case "remove_from_cart":
        console.log("Removing from cart...");
        await removeFromCart(args.input);
        break;
      case "clear_cart":
        console.log("Clearing cart...");
        await clearCart();
        break;
      case "add_to_wishlist":
        console.log("Adding to wishlist...");
        await addToWishlist(args.input);
        break;
      case "remove_from_wishlist":
        console.log("Removing from wishlist...");
        await removeFromWishlist(args.input);
        break;
      case "clear_wishlist":
        console.log("Clearing wishlist...");
        await clearWishlist();
        break;
      case "view_cart":
        console.log("Viewing cart...");
        await viewCart();
        break;
      case "view_wishlist":
        console.log("Viewing wishlist...");
        await viewWishlist();
        break;
      case "view_3d_model":
        console.log("Viewing 3D model...");
        await view3DModel(args.input);
        break
      default:
        console.error(`Unknown command: ${command}`);
        break;
    }
  }
  
  async function view(productId){
    try{
      if (productId) {
        console.log("Product Id: " , productId);
        //navigate to /product/productId
        navigate(`/product/${productId}`);
      } else {
        console.log(`Product with ID ${productId} not found.`);
      }
    }
    catch(err){
      //
    }
  }

  async function sendToCart(productId) {
    try {
      const { data: product } = await axios.get(`http://localhost:5000/api/products/${productId}`);
      if (product) {
        addToCart(product, 1);
        setMessages(prev => [...prev, { role: 'assistant', content: `Added ${product.name} to your cart.`, id: Date.now().toString() }]);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't add that item to your cart.`, id: Date.now().toString() }]);
    }
  }

  async function removeFromCart(productId) {
    try {
      removeFromCartContext(productId);
      setMessages(prev => [...prev, { role: 'assistant', content: `Item removed from your cart.`, id: Date.now().toString() }]);
    } catch (error) {
      console.error("Error removing from cart:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't remove that item from your cart.`, id: Date.now().toString() }]);
    }
  }

  async function clearCart() {
    try {
      clearCart();
      setMessages(prev => [...prev, { role: 'assistant', content: `Your cart has been cleared.`, id: Date.now().toString() }]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't clear your cart.`, id: Date.now().toString() }]);
    }
  }

  async function addToWishlist(productId) {
    try {
      const { data: product } = await axios.get(`http://localhost:5000/api/products/${productId}`);
      if (product) {
        const isWished = wishlist.some(p => p._id === product._id);
        if (!isWished) {
          toggleWishlist(product);
          setMessages(prev => [...prev, { role: 'assistant', content: `Added ${product.name} to your wishlist.`, id: Date.now().toString() }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `${product.name} is already in your wishlist.`, id: Date.now().toString() }]);
        }
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't add that item to your wishlist.`, id: Date.now().toString() }]);
    }
  }

  async function removeFromWishlist(productId) {
    try {
      const { data: product } = await axios.get(`http://localhost:5000/api/products/${productId}`);
      if (product) {
        const isWished = wishlist.some(p => p._id === product._id);
        if (isWished) {
          toggleWishlist(product);
          setMessages(prev => [...prev, { role: 'assistant', content: `Removed ${product.name} from your wishlist.`, id: Date.now().toString() }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `${product.name} was not in your wishlist.`, id: Date.now().toString() }]);
        }
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't remove that item from your wishlist.`, id: Date.now().toString() }]);
    }
  }

  async function clearWishlist() {
    try {
      clearWishlistContext();
      setMessages(prev => [...prev, { role: 'assistant', content: `Your wishlist has been cleared.`, id: Date.now().toString() }]);
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't clear your wishlist.`, id: Date.now().toString() }]);
    }
  }

  async function viewCart() {
    navigate('/cart');
  }

  async function viewWishlist() {
    navigate('/wishlist');
  }

  async function view3DModel(productId) {
    let botMessageId = Date.now().toString();
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Locating product for 3D view...', id: botMessageId }]);
      const { data: product } = await axios.get(`http://localhost:5000/api/products/${productId}`);
      if (!product) {
        setMessages(prev => prev.map(m => m.id === botMessageId ? {...m, content: "Sorry, I couldn't find that product."} : m));
        return;
      }

      const modelName = `ar_model_${product._id}.glb`;
      const modelUrl = `${window.location.origin}/model-ar/index.html?model=${modelName}`;

      setMessages(prev => prev.map(m => m.id === botMessageId ? {...m, content: 'Checking for existing 3D model...'} : m));
      const checkRes = await fetch(`http://localhost:5000/api/model-exists/${modelName}`);
      const checkData = await checkRes.json();

      if (checkData.exists) {
        setMessages(prev => prev.map(m => m.id === botMessageId ? {...m, content: 'Model found! Opening 3D view...'} : m));
        window.open(modelUrl, '_blank');
        return;
      }

      setMessages(prev => prev.map(m => m.id === botMessageId ? {...m, content: 'No existing model found. Generating a new one... This might take a moment.'} : m));
      const genRes = await fetch('http://localhost:5000/api/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: product.image, modelName })
      });

      if (!genRes.ok) {
        throw new Error('Failed to generate 3D model on the backend.');
      }

      setMessages(prev => prev.map(m => m.id === botMessageId ? {...m, content: 'Model generated successfully! Opening 3D view...'} : m));
      window.open(modelUrl, '_blank');

    } catch (err) {
      console.error('Error in view3DModel:', err);
      setMessages(prev => prev.map(m => m.id === botMessageId ? {...m, content: 'Sorry, there was an error generating the 3D model. Please try again later.'} : m));
    }
  }
  
  
  async function generateContent(apiMessages){
    console.log(apiMessages);
    try{
      const stream = await groqClient.chat.completions.create({
        messages: apiMessages,
        model: "qwen/qwen3-32b",
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        response_format: {"type": "json_object"}
      });
  
      const fullResponse = stream.choices[0].message.content;
      try{
        const cleanedResponse = fullResponse
                            .replace("```json\n", "")
                            .replace("\n```", "");
        
        const response = JSON.parse(cleanedResponse);
        const writeText = response.response;
        const command = response.command.name;
        const args = response.command.args;

        const commandsWithOwnFeedback = [
          'send_to_cart',
          'remove_from_cart',
          'clear_cart',
          'add_to_wishlist',
          'remove_from_wishlist',
          'clear_wishlist',
          'view_3d_model'
        ];

        // If a command is present that will provide its own UI feedback,
        // we don't need to display the generic "response" text from the LLM.
        if (!commandsWithOwnFeedback.includes(command)) {
          const botMessage = {role:"assistant", content: writeText, finished:true, id:(Date.now() + 1).toString()};
          setMessages(prevMessages => [...prevMessages, botMessage]);
        }

        if(command && args) await executeCommand(command, args);
        return writeText;
      } catch (error) {
          console.error("Error parsing JSON response or executing command:", error);
  
          // Add an error message to the chat if the JSON parsing fails.
          setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: `Something went wrong! ask it again.`, finished: true, id:(Date.now() + 1).toString() }]);
          return null;
      }
  
    } catch (error) {
        console.error("Error with Groq:", error);
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: `Something went wrong! ask it again.`, finished: true, id:(Date.now() + 1).toString() }]); // Show Groq error to the user.
  
        return null;
    }
  }



async function preProcessMessage(message){
  if(!message) return;

  const recentHistory = messages.slice(-9).map(m => ({ role: m.role, content: m.content }));


  const products = await fetch("http://localhost:5000/api/chatbot/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message, history: JSON.stringify(recentHistory), targetIds: targetIdsRef.current }),
  })
  .then(response => response.json())
 
  console.log("Products:", products);

  // a string containing comma separated ids of products
  const ids = products.map(p => p._id).join(",");

  targetIdsRef.current = "The targeted Ids are: " + ids + ".";
  console.log("Target Ids:", targetIdsRef.current);



  if (products.length === 0) {
      return "I couldn't find any products matching your request. Please try asking something else!";
    }

    // Filter out unnecessary fields from the product data before sending to the AI
    const filteredProducts = products.map(({ image, createdAt, updatedAt, __v, ...rest }) => rest);

    const newMessage = {role: "user", content: message, id: Date.now().toString()};
  setMessages(prevMessages => [...prevMessages, newMessage]);

  try{
    // To manage conversation history effectively, we'll construct a clean payload for the API.
    // This ensures the history doesn't grow indefinitely and that the message order is correct.
    const systemPrompt = `You are a friendly and helpful e-commerce chatbot assistant for a store called 'WalMart'. Your name is 'RetailBot'.
      Based on the following product data that was found in the database, provide a concise and conversational answer to the user's LATEST query.
      Do not just list the products. Summarize the findings in a helpful way along with listing the products.
      If the user asked for a specific number of items, mention that you found them.
      Keep your response friendly and brief.

      Your decisions must always be made independently without seeking user assistance. Play to your strengths as an LLM and pursue simple strategies with no legal complications.

      Commands:
      1. View Product: "view_product", args: {input: "<'_id' of the requested product>"}
      2. Add to Cart: "send_to_cart", args: {input: "<'_id' of the product to add>"}
      3. Remove from Cart: "remove_from_cart", args: {input: "<'_id' of the product to remove>"}
      4. Clear Cart: "clear_cart", args: {}
      5. Add to Wishlist: "add_to_wishlist", args: {input: "<'_id' of the product to add>"}
      6. Remove from Wishlist: "remove_from_wishlist", args: {input: "<'_id' of the product to remove>"}
      7. Clear Wishlist: "clear_wishlist", args: {}
      8. View Cart: "view_cart", args: {}
      9. View Wishlist: "view_wishlist", args: {}
      10. View 3D Model: "view_3d_model", args: {input: "<'_id' of the product>"}
      11. Do Nothing: "do_nothing", args: {}

      Resources:
      Product Data: ${JSON.stringify(filteredProducts)} - Use this above Products data that is fetched from the Database of Products of Walmart.

      You MUST only respond in a raw JSON format.Do not include markdown formatting like \`\`\`json.
      The JSON object must follow this exact structure:
      {
          "response": "The final, well-formatted, conversational text to show the user.",
          "command": { "name": "<command_name>", "args": { "input": "<_id of the product if applicable, otherwise empty string>" } }
      }`;

    // Construct the final payload with the correct order: system, then history, then the new user message.
    const apiMessagesForCall = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user", content: message }
    ];

    const result = await generateContent(apiMessagesForCall);
    return result;
  }
  catch(error){
    console.log("Error in preProcessMessage: ", error);
    return "Sorry, something went wrong on my end. Please try again.";
  }
}






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
    targetIdsRef.current = '';
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
      // If already speaking, stop it
      if (isSpeaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
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
    setInput('');
    setIsLoading(true);
    try {
      const responseText = await preProcessMessage(textToSend);
      if (responseText && conversationModeRef.current) {
        speak(responseText);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorId = Date.now().toString();
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.', id: errorId }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h2>Walmart Assistant</h2>
            <div className="header-buttons">
              <button style={{"font-size": "28px"}} onClick={handleNewChat} className="new-chat-btn" title="New Chat">+</button>
              <button onClick={toggleChat} className="close-btn" title="Close Chat">&times;</button>
            </div>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                <span>{msg.content}</span>
                {msg.role === 'assistant' && msg.content && 'speechSynthesis' in window && (
                  <button onClick={() => speak(msg.content)} className="speak-btn" title="Read aloud">
                    🔊
                  </button>
                )}
              </div>
            ))}
            {isLoading && <div key="loading" className="message bot">...</div>}
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
                ✨
              </button>
            )}
            <button style={{"display":"flex", "font-size": "24px", "position": "relative", "right": "6px"}} onClick={() => handleSend()} disabled={isLoading || !input.trim() || isConversationMode}>➤</button>
          </div>
        </div>
      )}
      <button onClick={toggleChat} className="chat-toggle-btn">
        {isOpen ? '✖' : '💬'}
      </button>
    </div>
  );
};

export default Chatbot;