import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);
  const isConnecting = useRef(false);

  const updateStatus = useCallback((status) => {
    console.log(`[WebSocket] ${status}`);
    setConnectionStatus(status);
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting.current) return;
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) return;

    updateStatus('connecting');
    isConnecting.current = true;

    try {
      const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || 'https://mechanic-setu-int0.onrender.com';
       const accessToken = Cookies.get('access') || localStorage.getItem('access');

      if (!accessToken) {
        throw new Error("Token missing from Node.js response.");
      }

      // 2. Connect to Django using the retrieved token
      const wsBase = import.meta.env.VITE_WS_BASE || 'wss://mechanic-setu-int0.onrender.com';
      const wsUrl = `${wsBase}/ws/job_notifications/?token=${encodeURIComponent(accessToken)}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket Connection successful!');
        updateStatus('connected');
        setSocket(ws.current);
      };

      ws.current.onmessage = (event) => {
        const messageData = JSON.parse(event.data);
        setLastMessage(messageData);
      };

      ws.current.onclose = (event) => {
        if (event.code !== 1000) toast.error('Real-time connection lost.');
        updateStatus('disconnected');
      };

      ws.current.onerror = () => {
        updateStatus('error');
      };

    } catch (error) {
      console.error('Connection setup failed:', error);
      updateStatus('error');
    } finally {
      isConnecting.current = false;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close(1000, "Provider unmounted");
        ws.current = null;
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ socket, lastMessage, connectionStatus, connect }}>
      {children}
    </WebSocketContext.Provider>
  );
};
