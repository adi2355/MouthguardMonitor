// app/(tabs)/trending.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  Platform,
  BlurView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

// Design constants
const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  primary: '#00E676', // Neon green
  primaryDark: '#00C853',
  accent: '#69F0AE', // Light neon green
  text: {
    primary: '#FFFFFF',
    secondary: '#FFFFFFCC', // 80% white
    tertiary: '#FFFFFF99', // 60% white
    quaternary: '#FFFFFF66', // 40% white
  },
  trending: {
    up: '#69F0AE',
    down: '#FF5252'
  },
  divider: '#333333'
};

// Sample trending data
const trendingCategories = [
  {
    title: 'Popular Strains',
    items: [
      { 
        id: '1', 
        name: 'Blue Dream', 
        description: 'Sweet berry aroma',
        thcContent: '18-24%',
        type: 'hybrid',
        icon: 'cannabis',
        
        color: COLORS.accent,
        percentChange: '+12%'
      },
      { 
        id: '2', 
        name: 'OG Kush', 
        description: 'Earthy pine scent',
        thcContent: '20-25%',
        type: 'hybrid',
        icon: 'cannabis',
      
        color: COLORS.primary,
        percentChange: '+8%'
      },
      { 
        id: '3', 
        name: 'Gorilla Glue', 
        description: 'Powerful diesel notes',
        thcContent: '25-28%',
        type: 'hybrid',
        icon: 'cannabis',
        
        color: COLORS.primaryDark,
        percentChange: '-3%'
      },
    ]
  },
  {
    title: 'Trending Accessories',
    items: [
      {
        id: '101',
        name: 'Something',
        description: 'ionknowdoessomthing',
        icon: 'pipe',
       
        color: COLORS.accent,
        percentChange: '+15%'
      },
      {
        id: '102',
        name: 'Lmao 3',
        description: 'Hopefullyworks',
        icon: 'pipe-disconnected',
      
        color: COLORS.primary,
        percentChange: '+10%'
      }
    ]
  },
  {
    title: 'Community Favorites',
    items: [
      {
        id: '201',
        name: 'Strawberry Cough',
        description: 'Sweet strawberry notes',
        thcContent: '17-22%',
        type: 'sativa',
        icon: 'cannabis',
        
        color: COLORS.accent,
        percentChange: '+5%'
      },
      {
        id: '202',
        name: 'Wedding Cake',
        description: 'Sweet and vanilla',
        thcContent: '22-25%',
        type: 'hybrid', 
        icon: 'cannabis',
       
        color: COLORS.primary,
        percentChange: '+7%'
      }
    ]
  }
];

export default function TrendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Animation values
  const searchBarWidth = useRef(new Animated.Value(width - 32)).current;
  const cancelOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const searchBarY = useRef(new Animated.Value(0)).current;
  
  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(insets.top + 100)).current;
  
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    
    Animated.parallel([
      Animated.timing(searchBarWidth, {
        toValue: width - 80,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(cancelOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(searchBarY, {
        toValue: -40,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleCancel = () => {
    setIsSearchFocused(false);
    setSearchQuery('');
    
    Animated.parallel([
      Animated.timing(searchBarWidth, {
        toValue: width - 32,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(cancelOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(searchBarY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Interpolation for collapsing header
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const renderSearchBar = () => {
    return (
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            transform: [{ translateY: searchBarY }],
            backgroundColor: isSearchFocused ? COLORS.background : 'transparent',
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.searchBarContainer, 
            { 
              width: searchBarWidth,
              borderColor: isSearchFocused ? COLORS.primary : 'transparent',
              shadowColor: isSearchFocused ? COLORS.primary : 'transparent',
            }
          ]}
        >
          <MaterialCommunityIcons 
            name="magnify" 
            size={22} 
            color={COLORS.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search strains, accessories..."
            placeholderTextColor={COLORS.text.quaternary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            returnKeyType="search"
            selectionColor={COLORS.accent}
          />
          {searchQuery !== '' && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialCommunityIcons 
                name="close-circle" 
                size={18} 
                color={COLORS.text.quaternary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
        <Animated.View style={{ opacity: cancelOpacity }}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  const TrendingIndicator = ({ isUp, percentChange }) => (
    <View style={styles.trendingIndicatorContainer}>
      <MaterialCommunityIcons 
        name={isUp ? "trending-up" : "trending-down"} 
        size={14} 
        color={isUp ? COLORS.trending.up : COLORS.trending.down}
        style={styles.trendingIcon}
      />
      <Text 
        style={[
          styles.percentChangeText,
          { color: isUp ? COLORS.trending.up : COLORS.trending.down }
        ]}
      >
        {percentChange}
      </Text>
    </View>
  );

  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.trendingItem}
      onPress={() => router.push({
        pathname: "/dataOverviews/strains/strainDetails",
        params: { id: item.id }
      })}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.05)', 'rgba(0,230,118,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.itemGradient}
      />
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <MaterialCommunityIcons name={item.icon} size={24} color={COLORS.background} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          
        </View>
        <Text style={styles.itemDescription}>{item.description}</Text>
        {item.thcContent && (
          <View style={styles.badgeContainer}>
            <Text style={styles.thcBadge}>THC: {item.thcContent}</Text>
            {item.type && (
              <Text style={styles.typeBadge}>{item.type}</Text>
            )}
          </View>
        )}
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={20} 
        color={COLORS.text.quaternary}
        style={styles.chevronIcon}
      />
    </TouchableOpacity>
  );

  const renderCategorySection = ({ item }) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <FlatList
        data={item.items}
        renderItem={renderTrendingItem}
        keyExtractor={item => item.id}
        horizontal={false}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        scrollEnabled={false}
      />
    </View>
  );

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.headerContainer,
        {
          opacity: headerOpacity,
          transform: [
            { scale: headerScale },
            { translateY: headerTranslateY }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(0,230,118,0.3)', 'rgba(0,230,118,0.1)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      />
      <Animated.Text 
        style={[
          styles.headerTitle,
          { opacity: titleOpacity }
        ]}
      >
        Trending
      </Animated.Text>
      <Animated.Text 
        style={[
          styles.headerSubtitle,
          { opacity: titleOpacity }
        ]}
      >
        Discover what's popular right now
      </Animated.Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
        {renderHeader()}
        {renderSearchBar()}
        
        {isSearchFocused ? (
          <View style={styles.searchResults}>
            <MaterialCommunityIcons 
              name="leaf" 
              size={40} 
              color={COLORS.primary}
              style={styles.leafIcon}
            />
            <Text style={styles.searchPrompt}>
              {searchQuery === '' ? 
                'Start typing to search...' : 
                `Search results for "${searchQuery}"`}
            </Text>
          </View>
        ) : (
          <Animated.FlatList
            data={trendingCategories}
            renderItem={renderCategorySection}
            keyExtractor={(item, index) => `category-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            bounces={true}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text.secondary,
    letterSpacing: 0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
  },
  searchIcon: {
    marginRight: 10,
  },
  clearButton: {
    padding: 4,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: 16,
    padding: 0,
    height: '100%',
    fontWeight: '400',
  },
  cancelButton: {
    paddingLeft: 16,
    height: 44,
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 40,
  },
  categorySection: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  itemGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: 0.1,
  },
  
  trendingIcon: {
    marginRight: 4,
  },
  percentChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thcBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.tertiary,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  typeBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.tertiary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: 'transparent',
    marginVertical: 4,
  },
  searchResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIcon: {
    marginBottom: 16,
  },
  searchPrompt: {
    color: COLORS.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 24,
  },
});