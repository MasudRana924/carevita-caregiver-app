import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const AUTO_HIDE_MS = 2000;

const NotificationBanner = ({visible, title, body, onPress, onHide}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      hideBanner();
    }, AUTO_HIDE_MS);

    return () => clearTimeout(timer);
  }, [visible, title, body]);

  const hideBanner = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished && onHide) {
        onHide();
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: Math.max(insets.top, 8) + 6,
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <Pressable
        onPress={() => {
          hideBanner();
          if (onPress) {
            onPress();
          }
        }}
        style={styles.card}>
        <View style={styles.iconWrap}>
          <Image
            source={require('../../assets/auth.png')}
            style={styles.logo}
          />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.appName} numberOfLines={1}>
            Nirapod
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {title || body || 'Notification'}
          </Text>
        </View>
        <Text style={styles.now}>now</Text>
      </Pressable>
    </Animated.View>
  );
};

export default NotificationBanner;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 9999,
    elevation: 24,
  },
  card: {
    height: 58,
    borderRadius: 28,
    backgroundColor: '#3A3A3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0B8A80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  logo: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#C7C7CC',
  },
  now: {
    marginLeft: 8,
    marginRight: 6,
    fontSize: 13,
    color: '#C7C7CC',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});
