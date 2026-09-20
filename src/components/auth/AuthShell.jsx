import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {FORM, formStyles} from '../common/formStyles';

export const AUTH = {
  teal: FORM.teal,
  title: FORM.title,
  muted: FORM.muted,
  mint: '#F3F8F6',
  button: FORM.button,
  page: FORM.page,
};

/** @deprecated Prefer AppInput / AppButton; kept for auth screens compatibility */
export const authStyles = StyleSheet.create({
  ...formStyles,
  primaryButton: {
    ...formStyles.primaryButton,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 22,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: FORM.muted,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: FORM.button,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
  },
});

const AuthShell = ({
  navigation,
  showBack = false,
  title,
  subtitle,
  children,
}) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH.page} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          bounces={false}>
          <View style={styles.hero}>
            {showBack ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.back}
                onPress={() => navigation?.goBack()}>
                <Icon name="arrow-back" size={20} color={AUTH.title} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.brandRow}>
              <View style={styles.brand}>
                <Image
                  source={require('../../assets/auth.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.tagline}>
                  Care for a{'\n'}better tomorrow
                </Text>
              </View>
              <Image
                source={require('../../assets/welcome-caregiver.jpg')}
                style={styles.heroImage}
                resizeMode="contain"
              />
              <Icon
                name="heart-outline"
                size={16}
                color={AUTH.teal}
                style={styles.floatHeart}
              />
            </View>

            <Text style={styles.title}>
              {title} <Text style={styles.titleHeart}></Text>
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <View style={styles.card}>
            {children}
            <View style={styles.leaves} pointerEvents="none">
              <Icon name="leaf-outline" size={34} color="#C8E6DC" />
              <Icon
                name="leaf-outline"
                size={42}
                color="#D4EEE6"
                style={styles.leafRight}
              />
              <Icon
                name="heart-outline"
                size={14}
                color="#C8E6DC"
                style={styles.leafHeart}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthShell;

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: AUTH.page},
  flex: {flex: 1},
  scroll: {flexGrow: 1},
  hero: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 18,
  },
  back: {
    width: 36,
    height: 36,
    // alignItems: 'center',
    // justifyContent: 'center',
    marginBottom: 4,
  },
  brandRow: {
    minHeight: 150,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  brand: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    zIndex: 2,
    maxWidth: '50%',
  },
  logo: {
    width: 44,
    height: 44,
  },
  tagline: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: AUTH.teal,
    textAlign: 'left',
  },
  heroImage: {
    position: 'absolute',
    right: -18,
    top: -8,
    width: 230,
    height: 190,
  },
  floatHeart: {
    position: 'absolute',
    right: 18,
    top: 8,
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 38,
    fontWeight: '800',
    color: AUTH.title,
    letterSpacing: -0.6,
    zIndex: 2,
  },
  titleHeart: {
    fontSize: 22,
    color: AUTH.teal,
    fontWeight: '400',
  },
  subtitle: {
    marginTop: 8,
    maxWidth: '72%',
    fontSize: 10,
    lineHeight: 20,
    color: AUTH.muted,
    zIndex: 2,
  },
  card: {
    flexGrow: 1,
    backgroundColor: AUTH.mint,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  leaves: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  leafRight: {
    transform: [{rotate: '28deg'}, {scaleX: -1}],
  },
  leafHeart: {
    marginBottom: 18,
    marginLeft: 4,
  },
});
