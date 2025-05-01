import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../types';
import { SessionRepository } from '../repositories/SessionRepository';
import { DatabaseManager } from '../DatabaseManager';

interface SessionContextType {
  activeSession: Session | null;
  startNewSession: (name?: string, team?: string) => Promise<Session>;
  endCurrentSession: () => Promise<void>;
  isSessionActive: boolean;
  sessionLoading: boolean;
  sessionInitError: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [sessionRepository, setSessionRepository] = useState<SessionRepository | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [sessionInitError, setSessionInitError] = useState<string | null>(null);

  // Initialize the repository
  useEffect(() => {
    const initRepo = async () => {
      setSessionInitError(null); // Reset error on attempt
      setSessionLoading(true);
      try {
        // Get database manager instance
        const dbManager = DatabaseManager.getInstance();
        // Ensure database is initialized
        await dbManager.ensureInitialized();
        // Get database
        const db = await dbManager.getDatabase('mouthguardMonitor');
        // Create repository
        const repo = new SessionRepository(db);
        setSessionRepository(repo);

        // Check for unfinished session
        const unfinished = await repo.findUnfinishedSession();
        if (unfinished) {
          // Add validation for startTime
          if (typeof unfinished.startTime === 'number' && !isNaN(unfinished.startTime)) {
            console.log(`[SessionContext] Found valid unfinished session: ${unfinished.id}`);
            setActiveSession(unfinished);
          } else {
            console.warn(`[SessionContext] Found unfinished session (${unfinished.id}) with invalid startTime (${unfinished.startTime}). Discarding.`);
            // Could potentially fix the session here by adding a valid startTime
            // But for now, just don't set it as active
          }
        }
        setSessionLoading(false);
      } catch (error) {
        console.error('[SessionContext] Error initializing repository:', error);
        setSessionInitError(error instanceof Error ? error.message : "Failed to initialize session system.");
        setSessionLoading(false);
      }
    };

    initRepo();
  }, []);

  const startNewSession = useCallback(async (name?: string, team?: string): Promise<Session> => {
    if (!sessionRepository) {
      throw new Error('Session repository not initialized');
    }

    if (activeSession) {
      console.log(`[SessionContext] Cannot start new session, session ${activeSession.id} is already active`);
      return activeSession; // Return existing session if already active
    }

    const now = Date.now();
    const newSession: Session = {
      id: `session_${uuidv4()}`,
      name: name || `Session ${new Date(now).toLocaleString()}`,
      startTime: now,
      team: team,
      createdAt: now,
    };

    try {
      await sessionRepository.saveSession(newSession);
      setActiveSession(newSession);
      console.log(`[SessionContext] Started new session: ${newSession.id}`);
      return newSession;
    } catch (error) {
      console.error('[SessionContext] Error starting new session:', error);
      throw error;
    }
  }, [activeSession, sessionRepository]);

  const endCurrentSession = useCallback(async (): Promise<void> => {
    if (!sessionRepository || !activeSession) {
      console.log('[SessionContext] No active session to end');
      return;
    }

    const now = Date.now();
    const updatedSession: Session = {
      ...activeSession,
      endTime: now
    };

    try {
      await sessionRepository.updateSession(updatedSession);
      console.log(`[SessionContext] Ended session: ${activeSession.id}`);
      setActiveSession(null);
    } catch (error) {
      console.error('[SessionContext] Error ending session:', error);
      throw error;
    }
  }, [activeSession, sessionRepository]);

  const contextValue: SessionContextType = {
    activeSession,
    startNewSession,
    endCurrentSession,
    isSessionActive: !!activeSession,
    sessionLoading,
    sessionInitError
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 