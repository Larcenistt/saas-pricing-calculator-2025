import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

export default function SimpleLiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! 👋 Flash sale ending soon - Save $20 today!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-open after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('chatOpened')) {
        setIsOpen(true);
        sessionStorage.setItem('chatOpened', 'true');
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const autoResponses = {
    price: "Great question! During our flash sale, you get instant access for just $79 (normally $99). That's a $20 savings that ends in less than 48 hours!",
    how: "Simply enter your current pricing and customer metrics, and our AI analyzes 500+ similar SaaS companies to find your optimal price point. Takes just 5 minutes!",
    worth: "Most of our users see a 30-47% revenue increase after implementing our recommendations. With our 30-day money-back guarantee, it's risk-free to try!",
    demo: "I'd be happy to help! Click 'Start Free Analysis' to begin with our interactive calculator. You'll see initial results immediately!",
    discount: "You're in luck! Use code SAVE20NOW for an extra discount. Combined with our flash sale, you're getting incredible value!",
    guarantee: "Yes! We offer a 30-day money-back guarantee. If you don't find valuable insights for your pricing strategy, we'll refund you 100%.",
    competitor: "Our calculator analyzes real-time market data from 500+ SaaS companies, provides AI-powered recommendations, and includes competitor analysis - all for a one-time fee of $79!",
    support: "You get lifetime access to the calculator, all future updates, and email support at support@predictionnexus.com. We're here to help you succeed!",
    default: "Thanks for your message! For the fastest response, email us at support@predictionnexus.com or check out our calculator to see how much revenue you're leaving on the table!"
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: inputValue }]);
    
    // Show typing indicator
    setIsTyping(true);

    // Generate auto-response
    const lowerInput = inputValue.toLowerCase();
    let response = autoResponses.default;

    if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('how much')) {
      response = autoResponses.price;
    } else if (lowerInput.includes('how') || lowerInput.includes('work')) {
      response = autoResponses.how;
    } else if (lowerInput.includes('worth') || lowerInput.includes('value')) {
      response = autoResponses.worth;
    } else if (lowerInput.includes('demo') || lowerInput.includes('try') || lowerInput.includes('see')) {
      response = autoResponses.demo;
    } else if (lowerInput.includes('discount') || lowerInput.includes('coupon') || lowerInput.includes('code')) {
      response = autoResponses.discount;
    } else if (lowerInput.includes('guarantee') || lowerInput.includes('refund') || lowerInput.includes('money back')) {
      response = autoResponses.guarantee;
    } else if (lowerInput.includes('competitor') || lowerInput.includes('compare') || lowerInput.includes('different')) {
      response = autoResponses.competitor;
    } else if (lowerInput.includes('support') || lowerInput.includes('help') || lowerInput.includes('contact')) {
      response = autoResponses.support;
    }

    // Add bot response after delay
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 1500);

    setInputValue('');
  };

  const quickQuestions = [
    "What's the price?",
    "How does it work?",
    "Is there a guarantee?",
    "Can I see a demo?"
  ];

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                1
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Sales Assistant</p>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online - Flash Sale Active!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-200 border border-gray-700'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-400 p-3 rounded-lg border border-gray-700">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-200"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-400"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputValue(question);
                        handleSend();
                      }}
                      className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}