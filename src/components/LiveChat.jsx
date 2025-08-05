import { useEffect } from 'react';

export default function LiveChat() {
  useEffect(() => {
    // Live chat temporarily disabled - uncomment and add Crisp ID to enable
    /*
    // Crisp Chat Configuration
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "YOUR-CRISP-ID-HERE"; // Replace with your Crisp website ID
    
    // Load Crisp
    (function() {
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
    
    // Configure Crisp
    window.$crisp.push(["safe", true]);
    window.$crisp.push(["config", "color:theme", ["black"]]);
    window.$crisp.push(["config", "color:chatbox", ["#0ea5e9"]]); // Primary color
    window.$crisp.push(["config", "position:reverse", true]); // Right side
    
    // Set user data if available
    const userEmail = localStorage.getItem('user_email');
    if (userEmail) {
      window.$crisp.push(["set", "user:email", [userEmail]]);
    }
    
    // Pre-written messages for common questions
    window.$crisp.push(["set", "message:text", ["Hi! 👋 Need help with pricing? I'm here to answer any questions about the calculator or your results."]]);
    
    // Auto-message on calculator page
    if (window.location.pathname === '/calculator') {
      setTimeout(() => {
        window.$crisp.push(["do", "message:show", ["Need help understanding your results? I can explain what the numbers mean!", true]]);
      }, 10000); // Show after 10 seconds
    }
    
    // Track chat interactions
    window.$crisp.push(["on", "chat:opened", () => {
      if (window.gtag) {
        window.gtag('event', 'chat_opened', {
          event_category: 'engagement',
          event_label: 'live_chat'
        });
      }
    }]);
    
    window.$crisp.push(["on", "message:sent", () => {
      if (window.gtag) {
        window.gtag('event', 'chat_message_sent', {
          event_category: 'engagement',
          event_label: 'live_chat'
        });
      }
    }]);
    
    // Cleanup
    return () => {
      // Remove Crisp when component unmounts
      if (window.$crisp) {
        window.$crisp.push(["do", "chat:hide"]);
      }
    };
    */
  }, []);
  
  return null; // This component doesn't render anything
}

// Alternative: Tawk.to Implementation (also free)
export function TawkChat() {
  useEffect(() => {
    const Tawk_API = window.Tawk_API || {};
    const Tawk_LoadStart = new Date();
    
    (function() {
      const s1 = document.createElement("script");
      const s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/YOUR-TAWK-ID/default'; // Replace with your Tawk.to ID
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      s0.parentNode.insertBefore(s1, s0);
    })();
    
    // Configure Tawk
    window.Tawk_API.onLoad = function() {
      // Set visitor name and email if available
      const userEmail = localStorage.getItem('user_email');
      if (userEmail) {
        window.Tawk_API.setAttributes({
          'email': userEmail
        }, function() {});
      }
      
      // Customize appearance
      window.Tawk_API.customStyle = {
        visibility: {
          desktop: {
            position: 'br', // bottom right
            xOffset: '20px',
            yOffset: '20px'
          },
          mobile: {
            position: 'br',
            xOffset: '10px',
            yOffset: '10px'
          }
        }
      };
    };
    
    // Track interactions
    window.Tawk_API.onChatStarted = function() {
      if (window.gtag) {
        window.gtag('event', 'chat_started', {
          event_category: 'engagement',
          event_label: 'tawk_chat'
        });
      }
    };
    
    return () => {
      // Hide chat on unmount
      if (window.Tawk_API && window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };
  }, []);
  
  return null;
}

// Instructions Component
export function LiveChatSetup() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Live Chat Setup Instructions</h2>
      
      <div className="space-y-6">
        <div className="glass p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Option 1: Crisp (Recommended)</h3>
          <ol className="list-decimal list-inside space-y-2 text-secondary/80">
            <li>Go to <a href="https://crisp.chat" target="_blank" className="text-primary hover:underline">crisp.chat</a></li>
            <li>Sign up for free account</li>
            <li>Get your Website ID from Settings → Website Settings</li>
            <li>Replace "YOUR-CRISP-ID-HERE" in LiveChat.jsx with your ID</li>
            <li>Customize colors and messages as needed</li>
          </ol>
          <p className="mt-4 text-sm text-muted">
            Free for 2 seats, unlimited chats, 30-day history
          </p>
        </div>
        
        <div className="glass p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Option 2: Tawk.to</h3>
          <ol className="list-decimal list-inside space-y-2 text-secondary/80">
            <li>Go to <a href="https://tawk.to" target="_blank" className="text-primary hover:underline">tawk.to</a></li>
            <li>Create free account</li>
            <li>Add your website</li>
            <li>Get widget code and extract the ID</li>
            <li>Use TawkChat component instead of LiveChat</li>
          </ol>
          <p className="mt-4 text-sm text-muted">
            100% free, unlimited agents, unlimited chats
          </p>
        </div>
        
        <div className="glass p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Quick Responses to Set Up</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-1">Pricing Question:</p>
              <p className="text-sm text-secondary/80 italic">
                "The calculator shows you're underpriced by [X]%. For just $99, you could be making $[Y] more per month. Want me to explain the analysis?"
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">How It Works:</p>
              <p className="text-sm text-secondary/80 italic">
                "Enter your current pricing and metrics, and our AI analyzes 500+ similar SaaS companies to find your optimal price. Takes just 5 minutes!"
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Objection Handling:</p>
              <p className="text-sm text-secondary/80 italic">
                "I understand the concern! That's why we offer a 30-day money-back guarantee. Most users see 20-80% revenue increase. Worth trying?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}