import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {FORM, formStyles} from './formStyles';

/**
 * Common button — same look as Login primary button.
 * variant: 'primary' | 'outline' | 'ghost'
 */
const AppButton = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  icon,
  iconColor,
  style,
  textStyle,
  children,
  ...rest
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const buttonStyle = [
    isPrimary && formStyles.primaryButton,
    isOutline && formStyles.outlineButton,
    isGhost && formStyles.ghostButton,
    disabled && isPrimary && formStyles.primaryButtonDisabled,
    disabled && !isPrimary && styles.disabledDim,
    style,
  ];

  const labelStyle = [
    isPrimary && formStyles.primaryButtonText,
    isOutline && formStyles.outlineButtonText,
    isGhost && formStyles.ghostButtonText,
    textStyle,
  ];

  const resolvedIconColor =
    iconColor ||
    (isPrimary ? '#FFFFFF' : isOutline ? FORM.danger : FORM.title);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      {...rest}>
      {icon ? <Icon name={icon} size={18} color={resolvedIconColor} /> : null}
      {title ? <Text style={labelStyle}>{title}</Text> : null}
      {children}
    </TouchableOpacity>
  );
};

/** Sticky bottom bar wrapping one or more AppButtons */
export const AppButtonBar = ({children, style}) => (
  <View style={[styles.bar, style]}>{children}</View>
);

const styles = StyleSheet.create({
  disabledDim: {opacity: 0.45},
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: FORM.page,
  },
});

export default AppButton;
