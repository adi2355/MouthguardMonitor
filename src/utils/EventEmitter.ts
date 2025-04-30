/**
 * Simple event emitter for communicating between services and hooks
 */
export class EventEmitter {
  private listeners: Record<string, Function[]> = {};

  /**
   * Add event listener
   * @param event Event name
   * @param callback Function to call when event is emitted
   */
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param event Event name
   * @param callback Function to remove
   */
  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit event to all listeners
   * @param event Event name
   * @param args Arguments to pass to listeners
   */
  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[EventEmitter] Error in event listener for ${event}:`, error);
      }
    });
  }
}

// Create and export singleton instance
export const dataChangeEmitter = new EventEmitter();

// Define common event names
export const dbEvents = {
  DATA_CHANGED: 'dataChanged',
  CONCUSSION_DETECTED: 'concussionDetected',
  SESSION_CREATED: 'sessionCreated',
  SESSION_UPDATED: 'sessionUpdated',
  SESSION_DELETED: 'sessionDeleted'
}; 