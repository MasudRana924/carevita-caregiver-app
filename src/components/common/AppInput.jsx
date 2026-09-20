import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {FORM, formStyles} from './formStyles';

/**
 * Common text field — same look as Login screen inputs.
 */
const AppInput = ({
  label,
  icon,
  rightIcon,
  onRightPress,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline = false,
  containerStyle,
  inputRowStyle,
  inputStyle,
  labelStyle,
  style,
  ...rest
}) => {
  return (
    <View style={[styles.wrap, containerStyle, style]}>
      {label ? <Text style={[formStyles.label, labelStyle]}>{label}</Text> : null}
      <View
        style={[
          formStyles.inputRow,
          multiline && formStyles.inputRowMultiline,
          inputRowStyle,
        ]}>
        {icon ? (
          <Icon
            name={icon}
            size={18}
            color={FORM.icon}
            style={multiline ? styles.multiIcon : undefined}
          />
        ) : null}
        <TextInput
          style={[
            formStyles.input,
            multiline && formStyles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={FORM.placeholder}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          selectionColor={FORM.teal}
          {...rest}
        />
        {rightIcon ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRightPress}
            disabled={!onRightPress}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name={rightIcon} size={18} color={FORM.icon} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {width: '100%'},
  multiIcon: {marginTop: 2},
});

export default AppInput;
