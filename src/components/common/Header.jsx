import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Common app header: left icon + centered title (+ optional right).
 */
const Header = ({
  title,
  leftIcon,
  onLeftPress,
  onBack,
  showBack = true,
  showLeft = true,
  rightComponent,
}) => {
  const insets = useSafeAreaInsets();
  const resolvedLeftIcon = leftIcon || (showBack ? 'arrow-back' : null);
  const handleLeftPress = onLeftPress || (showBack ? onBack : undefined);
  const leftPressable = typeof handleLeftPress === 'function';

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={[styles.container, {paddingTop: Math.max(insets.top, 8)}]}>
        <View style={styles.content}>
          {showLeft && resolvedLeftIcon ? (
            leftPressable ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.sideBtn}
                onPress={handleLeftPress}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Icon name={resolvedLeftIcon} size={22} color="#172333" />
              </TouchableOpacity>
            ) : (
              <View style={styles.sideBtn}>
                <Icon name={resolvedLeftIcon} size={22} color="#172333" />
              </View>
            )
          ) : (
            <View style={styles.sideBtn} />
          )}

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.sideBtn}>
            {rightComponent || null}
          </View>
        </View>
      </View>
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EEF2',
  },
  content: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  sideBtn: {
    width: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#172333',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
