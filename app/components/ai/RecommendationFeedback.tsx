import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AIService } from '../../../src/services/ai';

interface RecommendationFeedbackProps {
  userId: string;
  recommendationId: string;
  onClose: () => void;
}

export default function RecommendationFeedback({ 
  userId, 
  recommendationId, 
  onClose 
}: RecommendationFeedbackProps) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [accurateEffects, setAccurateEffects] = useState<boolean | null>(null);
  const [wouldTryAgain, setWouldTryAgain] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Get AIService instance
  const aiService = AIService.getInstance();
  
  const handleSubmit = async () => {
    if (helpful === null) return;
    
    setSubmitting(true);
    
    try {
      // Calculate relevance score (1-5) based on user feedback
      const relevance = calculateRelevanceScore(helpful, accurateEffects, wouldTryAgain);
      
      await aiService.submitRecommendationFeedback(
        userId,
        recommendationId,
        helpful,
        accurateEffects || false,
        relevance,
        comments
      );
      
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Calculate a relevance score (1-5) based on user feedback
  const calculateRelevanceScore = (
    helpful: boolean, 
    accurateEffects: boolean | null, 
    wouldTryAgain: boolean | null
  ): number => {
    if (!helpful) return 1; // Not helpful at all
    
    // Base score for helpful
    let score = 3;
    
    // Add points for accurate effects
    if (accurateEffects) score += 1;
    
    // Add points for would try again
    if (wouldTryAgain) score += 1;
    
    return Math.min(score, 5); // Cap at 5
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was this recommendation?</Text>
      
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>Was this recommendation helpful?</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[
              styles.optionButton,
              helpful === true && styles.selectedButton
            ]}
            onPress={() => setHelpful(true)}
          >
            <MaterialCommunityIcons 
              name="thumb-up" 
              size={20} 
              color={helpful === true ? '#FFFFFF' : '#AAAAAA'} 
            />
            <Text style={[
              styles.optionText,
              helpful === true && styles.selectedOptionText
            ]}>Yes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.optionButton,
              helpful === false && styles.selectedButton
            ]}
            onPress={() => setHelpful(false)}
          >
            <MaterialCommunityIcons 
              name="thumb-down" 
              size={20} 
              color={helpful === false ? '#FFFFFF' : '#AAAAAA'} 
            />
            <Text style={[
              styles.optionText,
              helpful === false && styles.selectedOptionText
            ]}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {helpful !== null && (
        <>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>Were the effects as described?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[
                  styles.optionButton,
                  accurateEffects === true && styles.selectedButton
                ]}
                onPress={() => setAccurateEffects(true)}
              >
                <Text style={[
                  styles.optionText,
                  accurateEffects === true && styles.selectedOptionText
                ]}>Yes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton,
                  accurateEffects === false && styles.selectedButton
                ]}
                onPress={() => setAccurateEffects(false)}
              >
                <Text style={[
                  styles.optionText,
                  accurateEffects === false && styles.selectedOptionText
                ]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>Would you try this strain again?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[
                  styles.optionButton,
                  wouldTryAgain === true && styles.selectedButton
                ]}
                onPress={() => setWouldTryAgain(true)}
              >
                <Text style={[
                  styles.optionText,
                  wouldTryAgain === true && styles.selectedOptionText
                ]}>Yes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton,
                  wouldTryAgain === false && styles.selectedButton
                ]}
                onPress={() => setWouldTryAgain(false)}
              >
                <Text style={[
                  styles.optionText,
                  wouldTryAgain === false && styles.selectedOptionText
                ]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.commentsContainer}>
            <Text style={styles.questionText}>Additional comments (optional)</Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Share your experience..."
              placeholderTextColor="#888888"
              value={comments}
              onChangeText={setComments}
              multiline
              maxLength={500}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    color: '#AAAAAA',
    fontSize: 16,
    marginLeft: 8,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  commentsContainer: {
    marginBottom: 20,
  },
  commentsInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 