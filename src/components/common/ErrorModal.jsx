import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppButton from './AppButton';
import {FORM} from './formStyles';

/**
 * Common error dialog — small message + OK to dismiss.
 */
const ErrorModal = ({
  visible,
  message,
  title = 'Error',
  onClose,
  buttonLabel = 'Okay',
}) => {
  const text =
    typeof message === 'string' && message.trim()
      ? message.trim()
      : 'Something went wrong. Please try again.';

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="alert-circle-outline" size={28} color="#DC2626" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{text}</Text>
          <AppButton
            title={buttonLabel}
            onPress={onClose}
            style={styles.okBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ErrorModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: FORM.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: FORM.muted,
    textAlign: 'center',
    marginBottom: 18,
  },
  okBtn: {
    alignSelf: 'stretch',
  },
});
