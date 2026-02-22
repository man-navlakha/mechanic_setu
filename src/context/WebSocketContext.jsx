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
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('%c[WS-PROVIDER] WebSocket already connected.', 'color: #008000;');
        return;
      }

      setConnectionStatus('connecting');
      console.log('%c[WS-PROVIDER] Attempting to connect...', 'color: #8A2BE2;');

      try {
        const wsBase =
          import.meta.env.VITE_WS_BASE || 'wss://mechanic-setu-int0.onrender.com';

        const tokenResponse = await fetch('/core/token/', {
          credentials: 'include',
        });
        if (!tokenResponse.ok) throw new Error('Failed to fetch access token');

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access || tokenData.access_token;
        if (!accessToken) throw new Error('Access token missing in response');

        const wsUrl = `${wsBase}/ws/job_notifications/?token=${encodeURIComponent(accessToken)}`;
        console.log(`%c[WS-PROVIDER] Connecting to: ${wsUrl}`, 'color: #0000FF;');
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('%c[WS-PROVIDER] ==> Connection successful!', 'color: #008000; font-weight: bold;');
          setConnectionStatus('connected');
          setSocket(ws.current);

          
        };

        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('%c[WS-PROVIDER] ==> Message Received:', 'color: #d3d3d3ff; font-weight: bold;', data);
          setLastMessage(data);
        };

        ws.current.onclose = (event) => {
          console.warn(`[WS-PROVIDER] ==> Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
          if (event.code !== 1000) {
            toast.error('Real-time connection lost.');
          }
          setConnectionStatus('disconnected');
        };

        ws.current.onerror = (error) => {
          console.error('[WS-PROVIDER] ==> An error occurred:', error);
          toast.error('A real-time connection error occurred.');
          setConnectionStatus('error');
        };

      } catch (error) {
        console.error('[WS-PROVIDER] ==> Connection setup failed:', error);
        setConnectionStatus('error');
      }
    };

    connect();

    return () => {
      if (ws.current) {
        console.log('[WS-PROVIDER] Provider unmounting. Closing WebSocket.');
        ws.current.close(1000, "Provider unmounted");
        ws.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (lastMessage) {
        console.log('%c[WS-PROVIDER] State updated with new message:', 'color: #FF00FF;', lastMessage);
    }
  }, [lastMessage]);

  const value = { socket, lastMessage, connectionStatus };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
