import React, {useEffect} from 'react';
import {View, Image, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const SplashScreen = ({onFinish}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2000);

    return () => clearTimeout(timer);
    // Only run once on mount — avoid resetting when parent recreates onFinish
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
