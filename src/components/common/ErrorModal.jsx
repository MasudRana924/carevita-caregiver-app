import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {FORM} from './formStyles';

/**
 * Common error dialog — bottom modal with error message and close button.
 */
const ErrorModal = ({
  visible,
  message,
  title = 'Error',
  onClose,
  buttonLabel = 'Close',
}) => {
  const text =
    typeof message === 'string' && message.trim()
      ? message.trim()
      : 'Something went wrong. Please try again.';

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}>
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          <View style={styles.card}>
            <View style={styles.iconRow}>
              <View style={styles.iconCircle}>
                <Icon name="alert-circle-outline" size={24} color="#DC2626" />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.message}>{text}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{buttonLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

export default ErrorModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: FORM.title,
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: FORM.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
