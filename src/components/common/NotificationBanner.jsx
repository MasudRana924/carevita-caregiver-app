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

const AUTO_HIDE_MS = 20 * 60 * 1000;

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
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
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
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
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
          top: Math.max(insets.top, 12) + 8,
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
        <View style={styles.left}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
          <View style={styles.textCol}>
            <Text style={styles.appName}>Nirapod</Text>
            <Text style={styles.title} numberOfLines={1}>
              {title || 'Notification'}
            </Text>
            {!!body && (
              <Text style={styles.body} numberOfLines={2}>
                {body}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    height: 80,
    borderRadius: 20,
    // borderWidth: 1,
    // borderColor: '#0606063e',
    backgroundColor: '#0606063e',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
   
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
  },
  title: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '400',
    color: '#111820',
  },
  body: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: '#8190A7',
  },
});

export default NotificationBanner;
