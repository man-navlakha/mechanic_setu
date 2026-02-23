import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);

  useEffect(() => {
    const connect = async () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

      setConnectionStatus('connecting');

      try {
        // 1. Fetch the token from your Node.js backend
        // (Make sure this URL matches exactly what you named the route in authRoutes.js for getAccessToken)
      // Grab the Node.js URL from env, or fallback to local Node server
const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || 'https://mechanic-setu-backend.vercel.app';

const tokenResponse = await fetch(`${NODE_API_URL}/api/get-token`, { 
    method: 'GET',
    credentials: 'include' 
});

        if (!tokenResponse.ok) {
            console.warn('User is not logged in or token expired.');
            setConnectionStatus('disconnected');
            return;
        }

        const data = await tokenResponse.json();
        const accessToken = data.access;

        if (!accessToken) {
            throw new Error("Token missing from Node.js response.");
        }

        // 2. Connect to Django using the retrieved token
        const wsBase = import.meta.env.VITE_WS_BASE || 'wss://mechanic-setu-int0.onrender.com';
        const wsUrl = `${wsBase}/ws/job_notifications/?token=${encodeURIComponent(accessToken)}`;
        
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('WebSocket Connection successful!');
          setConnectionStatus('connected');
          setSocket(ws.current);
        };

        ws.current.onmessage = (event) => {
          const messageData = JSON.parse(event.data);
          setLastMessage(messageData);
        };

        ws.current.onclose = (event) => {
          if (event.code !== 1000) toast.error('Real-time connection lost.');
          setConnectionStatus('disconnected');
        };

        ws.current.onerror = () => {
          setConnectionStatus('error');
        };

      } catch (error) {
        console.error('Connection setup failed:', error);
        setConnectionStatus('error');
      }
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close(1000, "Provider unmounted");
        ws.current = null;
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, lastMessage, connectionStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};