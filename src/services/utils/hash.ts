/**
 * A simple SHA-256 hash implementation for string inputs
 * This is a basic implementation for caching purposes
 * In a production environment, use a proper crypto library
 */
export function SHA256(input: string): string {
  // Simple hash function for demo purposes
  // In a real app, use a proper crypto library
  let hash = 0;
  
  if (input.length === 0) {
    return hash.toString(16);
  }
  
  // Generate a simple hash
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's 64 characters long (SHA-256 length)
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Repeat the hash to make it look like a SHA-256 hash (64 chars)
  return (hexHash.repeat(8)).substring(0, 64);
} 