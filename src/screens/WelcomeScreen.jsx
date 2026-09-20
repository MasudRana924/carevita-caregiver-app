import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AppButton from '../components/common/AppButton';
import {requestAppPermissions} from '../utils/permissions';

const TEAL = '#0B8A80';
const TITLE = '#0E2A24';

const FEATURES = [
  {
    icon: 'calendar-outline',
    title: 'Easy Bookings',
    text: 'Get assigned to families quickly and easily.',
  },
  {
    icon: 'heart-outline',
    title: 'Trusted Families',
    text: 'Work with respectful and caring families.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Grow Your Income',
    text: 'More opportunities, more stability.',
  },
];

const WelcomeScreen = ({navigation}) => {
  const goLogin = () => navigation?.navigate('Login');

  const handleGetStarted = async () => {
    try {
      await requestAppPermissions();
    } catch (error) {
      console.error('Permission error:', error);
    } finally {
      goLogin();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.hero}>
          <Image
            source={require('../assets/welcome-caregiver.jpg')}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Better{'\n'}Care</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>Together</Text>
              <Icon name="heart-outline" size={11} color={TEAL} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Welcome,{'\n'}Caregiver!</Text>
        <Text style={styles.subtitle}>
          You’re here to make a difference. Let’s help you provide the best
          care, with the right support.
        </Text>

        <View style={styles.features}>
          {FEATURES.map(item => (
            <View key={item.title} style={styles.feature}>
              <Icon name={item.icon} size={22} color={TEAL} />
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottom}>
          <AppButton title="Get Started" onPress={handleGetStarted} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  heroImage: {
    width: '100%',
    height: 230,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 0,
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: TEAL,
  },
  title: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: TITLE,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 12,
    marginHorizontal: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#6F7F8C',
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 10,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
  },
  featureTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
    color: TITLE,
    textAlign: 'center',
  },
  featureText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: '#8A97A6',
    textAlign: 'center',
  },
  bottom: {
    marginTop: 'auto',
    paddingTop: 28,
  },
});
