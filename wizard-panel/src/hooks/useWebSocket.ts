/**
 * Echo-OS WebSocket Client
 * Real-time badge updates ve frequency events
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface WebSocketEvent {
  type: string;
  entity?: { kind: string; id: string };
  job_id?: string;
  last_indexed_at?: string;
  sv_hash?: string;
  error?: string;
  updated_at?: string;
  flow_score?: number;
  episode_id?: string;
  scene_id?: string;
  score?: number;
  violations?: string[];
  queue_depth?: number;
  p95_latency_ms?: number;
  failure_rate?: number;
  ts: string;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEvent: WebSocketEvent | null;
}

export interface UseWebSocketOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  onEvent?: (event: WebSocketEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean; // Varsayılan olarak false olacak
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = '/ws/frequency',
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    heartbeatInterval = 25000,
    onEvent,
    onConnect,
    onDisconnect,
    enabled = false // WebSocket varsayılan olarak devre dışı
  } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastEvent: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const missedHeartbeatsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const envHost = import.meta.env?.VITE_WS_HOST as string | undefined
      const host = envHost || window.location.host

      // If caller passes a full ws(s) URL, use it as-is. Otherwise treat it as a path.
      const wsUrl =
        typeof url === 'string' && (url.startsWith('ws://') || url.startsWith('wss://'))
          ? url
          : `${protocol}//${host}${url}`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ 
          ...prev, 
          connected: true, 
          connecting: false, 
          error: null 
        }));
        reconnectAttemptsRef.current = 0;
        missedHeartbeatsRef.current = 0;
        onConnect?.();
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          
          if (data.type === 'PONG') {
            missedHeartbeatsRef.current = 0;
            return;
          }

          setState(prev => ({ ...prev, lastEvent: data }));
          onEvent?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          connecting: false 
        }));
        onDisconnect?.();
        stopHeartbeat();

        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
          const jitter = Math.random() * 0.1 * delay; // 10% jitter
          const totalDelay = delay + jitter;
          
          console.log(`Reconnecting in ${Math.round(totalDelay)}ms... (attempt ${reconnectAttemptsRef.current}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, totalDelay);
        } else {
          setState(prev => ({ 
            ...prev, 
            error: `Failed to reconnect after ${reconnectAttempts} attempts` 
          }));
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          error: 'WebSocket connection error' 
        }));
      };

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        connecting: false, 
        error: 'Failed to create WebSocket connection' 
      }));
    }
  }, [url, reconnectAttempts, reconnectDelay, onEvent, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      connected: false, 
      connecting: false 
    }));
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  const subscribe = useCallback((entityKinds: string[]) => {
    send({
      type: 'SUBSCRIBE',
      entity_kinds: entityKinds
    });
  }, [send]);

  const unsubscribe = useCallback((entityKinds: string[]) => {
    send({
      type: 'UNSUBSCRIBE',
      entity_kinds: entityKinds
    });
  }, [send]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    
    heartbeatTimeoutRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        send({ type: 'PING' });
        missedHeartbeatsRef.current++;
        
        if (missedHeartbeatsRef.current > 2) {
          console.warn('Missed too many heartbeats, reconnecting...');
          disconnect();
          connect();
        }
      }
    }, heartbeatInterval);
  }, [send, disconnect, connect, heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    ...state,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe
  };
};

// Hook for badge-specific WebSocket events
export const useBadgeWebSocket = (entityKind: string, entityId: string) => {
  const [badgeState, setBadgeState] = useState<string>('INDEXING');
  const [lastIndexedAt, setLastIndexedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback((event: WebSocketEvent) => {
    if (event.entity?.kind === entityKind && event.entity?.id === entityId) {
      switch (event.type) {
        case 'INDEX_STARTED':
          setBadgeState('INDEXING');
          setError(null);
          break;
        case 'INDEXED':
          setBadgeState('INDEXED');
          setLastIndexedAt(event.last_indexed_at || null);
          setError(null);
          break;
        case 'INDEX_FAILED':
          setBadgeState('RETRY');
          setError(event.error || 'Unknown error');
          break;
        case 'ENTITY_UPDATED':
          // Check if entity was updated after last index
          if (event.updated_at && lastIndexedAt && event.updated_at > lastIndexedAt) {
            setBadgeState('STALE');
          }
          break;
      }
    }
  }, [entityKind, entityId, lastIndexedAt]);

  const { connected, error: wsError } = useWebSocket({
    onEvent: handleEvent
  });

  return {
    badgeState,
    lastIndexedAt,
    error: error || wsError,
    connected
  };
};

// Hook for telemetry alerts
export const useTelemetryAlerts = () => {
  const [alerts, setAlerts] = useState<WebSocketEvent[]>([]);

  const handleEvent = useCallback((event: WebSocketEvent) => {
    if (event.type === 'HEALTH') {
      setAlerts(prev => {
        const newAlerts = [];
        
        if (event.p95_latency_ms && event.p95_latency_ms > 180000) {
          newAlerts.push({
            ...event,
            type: 'LATENCY_ALERT',
            message: 'Index latency high'
          });
        }
        
        if (event.failure_rate && event.failure_rate > 0.02) {
          newAlerts.push({
            ...event,
            type: 'FAILURE_ALERT',
            message: 'Index failures spiking'
          });
        }
        
        if (event.queue_depth && event.queue_depth > 20) {
          newAlerts.push({
            ...event,
            type: 'QUEUE_ALERT',
            message: 'Queue heavy'
          });
        }
        
        return [...prev, ...newAlerts].slice(-10); // Keep last 10 alerts
      });
    }
  }, []);

  useWebSocket({
    onEvent: handleEvent
  });

  return alerts;
};


