import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../../src/constants';

interface SubscriptionOption {
  id: string;
  title: string;
  price: string;
  duration: string;
  features: string[];
  popular?: boolean;
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (planId: string) => void;
}

const subscriptionOptions: SubscriptionOption[] = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$4.99',
    duration: 'per month',
    features: [
      'Unlimited bong hit logging',
      'Advanced analytics',
      'Export data to CSV',
      'Premium strain database access'
    ]
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '$49.99',
    duration: 'per year',
    features: [
      'All monthly features',
      'Save 17% compared to monthly',
      'Priority customer support',
      'Early access to new features'
    ],
    popular: true
  }
];

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  visible, 
  onClose,
  onSubscribe
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Upgrade to Pro</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.scrollView}>
                <Text style={styles.subtitle}>
                  Unlock premium features to enhance your cannabis tracking experience
                </Text>
                
                {subscriptionOptions.map((option) => (
                  <View 
                    key={option.id} 
                    style={[
                      styles.optionCard,
                      option.popular && styles.popularCard
                    ]}
                  >
                    {option.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Best Value</Text>
                      </View>
                    )}
                    
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{option.price}</Text>
                      <Text style={styles.duration}>{option.duration}</Text>
                    </View>
                    
                    <View style={styles.featuresContainer}>
                      {option.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <MaterialCommunityIcons 
                            name="check-circle" 
                            size={18} 
                            color={COLORS.primary} 
                          />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.subscribeButton}
                      onPress={() => onSubscribe(option.id)}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                        >
                        <Text style={styles.buttonText}>Subscribe</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.infoSection}>
                  <Text style={styles.infoText}>
                    • Subscription will be charged to your payment method through your App Store account
                  </Text>
                  <Text style={styles.infoText}>
                    • Subscription automatically renews unless canceled at least 24 hours before the end of the current period
                  </Text>
                  <Text style={styles.infoText}>
                    • Manage your subscriptions in Account Settings after purchase
                  </Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollView: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  popularCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 4,
  },
  duration: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  subscribeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginBottom: 8,
    lineHeight: 16,
  },
});

export default SubscriptionModal; 