import React from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const TEAL = '#0B8A80';
const RED = '#E34242';

/** Bottom success / error sheet, same look as LogoutConfirmModal. */
const StatusModal = ({visible, type = 'success', title, message, buttonLabel = 'OK', onClose}) => {
  const success = type === 'success';
  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          <View style={styles.card}>
            <View style={[styles.iconCircle, success ? styles.iconOk : styles.iconError]}>
              <Icon
                name={success ? 'checkmark' : 'alert'}
                size={26}
                color={success ? TEAL : RED}
              />
            </View>
            <Text style={styles.title}>{title || (success ? 'Success' : 'Something went wrong')}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <TouchableOpacity
              style={[styles.button, success ? styles.buttonOk : styles.buttonError]}
              onPress={onClose}
              activeOpacity={0.85}>
              <Text style={styles.buttonText}>{buttonLabel}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default StatusModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {width: '100%', paddingHorizontal: 15, paddingBottom: 20},
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconOk: {backgroundColor: '#E7F6F4'},
  iconError: {backgroundColor: '#FDECEC'},
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOk: {backgroundColor: TEAL},
  buttonError: {backgroundColor: RED},
  buttonText: {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
});
