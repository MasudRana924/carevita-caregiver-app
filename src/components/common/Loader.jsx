import React from 'react';
import {View, StyleSheet, Image, ActivityIndicator} from 'react-native';
import {Modal} from 'react-native';

const Loader = ({visible}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.loaderContainer}>
          <Image source={require('../../assets/auth.png')} style={styles.authImage} />
          {/* <ActivityIndicator size="large" color="#008178" style={styles.spinner} /> */}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  authImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  spinner: {
    marginTop: 4,
  },
});

export default Loader;
