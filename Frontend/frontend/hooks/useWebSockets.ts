// frontend/hooks/useWebSockets.ts
'use client';
import { useEffect, useState } from 'react';

export function useLiveBookings() {
  const [liveEvent, setLiveEvent] = useState<any>(null);

  useEffect(() => {
    // Connect to the FastAPI WebSocket endpoint
    const ws = new WebSocket('ws://localhost:8000/ws'); 
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'STATUS_UPDATE') {
        setLiveEvent(data); // Save the incoming update to state
      }
    };

    // Clean up the connection when the user leaves the page
    return () => ws.close();
  }, []);

  return liveEvent;
}