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
        <View pointerEvents="none" style={styles.blobLarge} />
        <View pointerEvents="none" style={styles.blobSmall} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          bounces={false}>
          {showBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.back}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={() => {
                if (navigation?.canGoBack?.()) {
                  navigation.goBack();
                }
              }}>
              <Icon name="arrow-back" size={22} color={AUTH.title} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backSpacer} />
          )}

          <View style={styles.brand}>
            <Image
              source={require('../../assets/auth.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Care for a better tomorrow</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthShell;

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: AUTH.page},
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  blobLarge: {
    position: 'absolute',
    top: -80,
    right: -46,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(14, 138, 120, 0.13)',
  },
  blobSmall: {
    position: 'absolute',
    top: 36,
    right: -90,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(14, 138, 120, 0.08)',
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
    zIndex: 2,
  },
  backSpacer: {height: 12},
  brand: {
    alignItems: 'flex-start',
    zIndex: 2,
  },
  logo: {
    width: 52,
    height: 52,
  },
  tagline: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: AUTH.teal,
  },
  title: {
    marginTop: 22,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: AUTH.title,
    letterSpacing: -0.4,
    zIndex: 2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: AUTH.muted,
    zIndex: 2,
  },
  form: {
    marginTop: 22,
    zIndex: 2,
  },
});
