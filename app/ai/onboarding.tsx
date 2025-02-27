import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define the step type with proper icon names
type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Personalized Recommendations",
    description: "Our AI analyzes your preferences and usage patterns to suggest strains tailored to your needs.",
    icon: "leaf",
    color: "#4CAF50"
  },
  {
    title: "Smart Safety Checks",
    description: "We automatically check for potential interactions and usage patterns to keep you informed and safe.",
    icon: "shield-check",
    color: "#2196F3"
  },
  {
    title: "Journal Insights",
    description: "Get personalized insights from your journal entries to better understand what works for you.",
    icon: "notebook",
    color: "#9C27B0"
  },
  {
    title: "AI Assistant",
    description: "Chat with our AI assistant to get answers about cannabis, effects, dosing, and more.",
    icon: "robot",
    color: "#FF9800"
  }
];

export default function AIOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Check if onboarding is already completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem('ai_onboarding_completed');
        if (hasCompletedOnboarding === 'true') {
          router.replace('/ai/recommendations');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setHasChecked(true);
      }
    };
    
    checkOnboardingStatus();
  }, [router]);
  
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };
  
  const completeOnboarding = async () => {
    try {
      setIsCompleting(true);
      await AsyncStorage.setItem('ai_onboarding_completed', 'true');
      
      // Add a small delay to ensure the AsyncStorage value is set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      router.replace('/ai/recommendations');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setIsCompleting(false);
    }
  };
  
  // Show loading screen while checking onboarding status
  if (!hasChecked) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  const step = ONBOARDING_STEPS[currentStep];
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <LinearGradient
        colors={['#000000', '#121212']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <View style={styles.stepIndicators}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.stepDot,
                currentStep === index && styles.activeStepDot
              ]} 
            />
          ))}
        </View>
        
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[step.color, `${step.color}80`]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons 
              name={step.icon} 
              size={60} 
              color="#FFFFFF" 
            />
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={completeOnboarding}
            disabled={isCompleting}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get Started'}
                </Text>
                <MaterialCommunityIcons 
                  name="arrow-right" 
                  size={20} 
                  color="#FFFFFF" 
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  stepIndicators: {
    flexDirection: 'row',
    marginBottom: 60,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  activeStepDot: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipButton: {
    padding: 16,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 