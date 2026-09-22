import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import AppButton from './AppButton';
import {FORM} from './formStyles';

/**
 * Bottom sheet alert — replaces system Alert.alert.
 * Margins: 15px left / right / bottom. Border radius: 15px.
 */
const AppAlertModal = ({
  visible,
  title,
  message,
  buttons = [],
  onRequestClose,
}) => {
  const actions =
    buttons.length > 0
      ? buttons
      : [{text: 'OK', style: 'default'}];

  const handlePress = button => {
    onRequestClose?.();
    // Defer so a nested showAlert from onPress can open cleanly
    setTimeout(() => {
      button?.onPress?.();
    }, 50);
  };

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        <View style={styles.sheet}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View
            style={[
              styles.actions,
              actions.length > 1 && styles.actionsRow,
            ]}>
            {actions.map((button, index) => {
              const styleName = button.style || 'default';
              const isCancel = styleName === 'cancel';
              const isDestructive = styleName === 'destructive';
              const isPrimary =
                !isCancel &&
                !isDestructive &&
                (styleName === 'default' || index === actions.length - 1);

              return (
                <AppButton
                  key={`${button.text}-${index}`}
                  title={button.text || 'OK'}
                  variant={isPrimary ? 'primary' : 'outline'}
                  onPress={() => handlePress(button)}
                  style={[
                    styles.btn,
                    actions.length > 1 && styles.btnFlex,
                    isDestructive && styles.destructiveBtn,
                  ]}
                  textStyle={isDestructive ? styles.destructiveText : undefined}
                />
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AppAlertModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: FORM.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: FORM.muted,
    textAlign: 'center',
    marginBottom: 18,
  },
  actions: {
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    alignSelf: 'stretch',
  },
  btnFlex: {
    flex: 1,
  },
  destructiveBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  destructiveText: {
    color: '#DC2626',
  },
});
