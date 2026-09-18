import React, {useEffect, useRef} from 'react';
import {View, Modal, StyleSheet, Animated, Easing} from 'react-native';

const Loader = ({
  visible = true,
  overlay = true,
  color = '#008178',
  size = 52,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (overlay && !visible) {
      return;
    }

    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [overlay, rotateAnim, visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinner = (
    <Animated.View
      style={[
        styles.spinner,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{rotate}],
        },
      ]}
    />
  );

  if (overlay) {
    return (
      <Modal
        visible={!!visible}
        transparent
        animationType="fade"
        statusBarTranslucent>
        <View style={styles.overlay}>{spinner}</View>
      </Modal>
    );
  }

  if (!visible) {
    return null;
  }

  return spinner;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  spinner: {
    borderWidth: 1,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default Loader;
