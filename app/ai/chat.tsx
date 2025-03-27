import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAIRecommendations from '../../src/hooks/useAIRecommendations';
import { ChatMessage, UserProfile } from '../../src/types';
import { COLORS } from '../../src/constants';
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';

// Mock user profile for demo purposes
const mockUserProfile: UserProfile = {
  id: 'user123',
  experience_level: 'intermediate',
  preferred_effects: ['relaxed', 'creative', 'uplifted'],
  medical_needs: ['stress', 'mild pain'],
  medications: [],
  avoid_effects: ['anxiety', 'paranoia'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Initial welcome message
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  content: "Hi there! I'm your cannabis assistant. I can help you find strains, answer questions about cannabis, or provide guidance on usage. What would you like to know?",
  role: 'assistant',
  timestamp: new Date().toISOString()
};

export default function ChatScreen() {
  const { loading, error, chatHistory, getChatResponse, clearChatHistory } = useAIRecommendations();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const flatListRef = useRef<FlatList>(null);
  
  // Initialize chat history
  useEffect(() => {
    if (chatHistory.length > 0) {
      setMessages([WELCOME_MESSAGE, ...chatHistory]);
    }
  }, [chatHistory]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');
    
    // Add user message to local state immediately for better UX
    const newUserMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: userMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    // Get AI response
    const response = await getChatResponse(userMessage, mockUserProfile);
    
    if (response) {
      setMessages(prev => [...prev, response]);
    } else if (error) {
      // Add error message if request failed
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // Clear chat history
  const handleClearChat = () => {
    clearChatHistory();
    setMessages([WELCOME_MESSAGE]);
  };
  
  // Render a chat message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="robot" size={24} color="#fff" />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
        
        {isUser && (
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={24} color="#fff" />
          </View>
        )}
      </View>
    );
  };
  
  if (loading && messages.length === 1) {
    return <LoadingView />;
  }
  
  if (error && messages.length === 1) {
    return <ErrorView error={error} />;
  }
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen 
        options={{
          title: 'AI Assistant',
          headerRight: () => (
            <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
              <MaterialCommunityIcons name="delete-outline" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
      />
      
      {error && messages.length > 1 && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.text.tertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          onSubmitEditing={handleSendMessage}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!message.trim() || loading) && styles.disabledSendButton
          ]}
          onPress={handleSendMessage}
          disabled={!message.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantMessageBubble: {
    backgroundColor: COLORS.cardBackground,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: COLORS.text.primary,
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text.primary,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  disabledSendButton: {
    backgroundColor: 'rgba(0, 230, 118, 0.3)',
  },
  clearButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    margin: 12,
  },
  errorText: {
    color: '#ff6b6b',
    marginLeft: 8,
    flex: 1,
  },
});