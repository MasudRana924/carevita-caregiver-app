import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {useDeliveryMethodFields} from '../api/queries';
import {useCreateWithdrawal} from '../api/mutations';

const WithdrawDetailsScreen = ({navigation, route}) => {
  const amount = Number(route?.params?.amount) || 0;
  const balance = Number(route?.params?.balance) || 0;
  const pendingWithdrawal = !!route?.params?.pendingWithdrawal;
  const selectedMethod = route?.params?.method || null;
  const passedLabel = route?.params?.methodLabel || selectedMethod;

  const [fieldValues, setFieldValues] = useState({});
  const [openSelectKey, setOpenSelectKey] = useState(null);
  const [formError, setFormError] = useState('');

  const fieldsQuery = useDeliveryMethodFields(selectedMethod, {
    enabled: !!selectedMethod,
  });
  const createWithdrawal = useCreateWithdrawal();

  const fields = useMemo(() => {
    const list = fieldsQuery.data?.data?.fields;
    return Array.isArray(list) ? list : [];
  }, [fieldsQuery.data]);

  const methodLabel = fieldsQuery.data?.data?.label || passedLabel;

  const updateField = (key, value) => {
    setFieldValues(prev => ({...prev, [key]: value}));
    if (formError) {
      setFormError('');
    }
  };

  const validate = () => {
    if (pendingWithdrawal) {
      return 'Wait until your current withdrawal is completed or rejected.';
    }
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return 'Enter a valid withdrawal amount';
    }
    if (amount < 100) {
      return 'Minimum withdrawal amount is ৳100';
    }
    if (amount > balance) {
      return 'Amount exceeds available balance';
    }
    if (!selectedMethod) {
      return 'Select a delivery method';
    }
    for (const field of fields) {
      const value = String(fieldValues[field.key] ?? '').trim();
      if (field.required && !value) {
        return `${field.label} is required`;
      }
    }
    return '';
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }

    const delivery_details = {};
    fields.forEach(field => {
      delivery_details[field.key] = String(fieldValues[field.key] ?? '').trim();
    });

    try {
      const response = await createWithdrawal.mutateAsync({
        amount,
        method: selectedMethod,
        delivery_details,
      });
      Alert.alert(
        'Withdrawal requested',
        response?.message ||
          'Your withdrawal request has been submitted and is pending review.',
        [{text: 'OK', onPress: () => navigation?.pop(2)}],
      );
    } catch (err) {
      setFormError(err?.message || 'Failed to submit withdrawal');
    }
  };

  const renderField = field => {
    const value = fieldValues[field.key] ?? '';

    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options : [];
      const selectedOption = options.find(opt => opt.value === value);
      const isOpen = openSelectKey === field.key;

      return (
        <View key={field.key} style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {field.required ? (
              <Text style={styles.requiredMark}> *</Text>
            ) : null}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.selectTrigger, isOpen && styles.selectTriggerOpen]}
            onPress={() =>
              setOpenSelectKey(prev => (prev === field.key ? null : field.key))
            }>
            <Text
              style={[
                styles.selectValue,
                !selectedOption && styles.selectPlaceholder,
              ]}>
              {selectedOption?.label || field.placeholder || 'Select option'}
            </Text>
            <View style={styles.chevronPill}>
              <Icon
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#008178"
              />
            </View>
          </TouchableOpacity>
          {isOpen && (
            <View style={styles.selectMenu}>
              {options.map((opt, index) => {
                const active = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.85}
                    style={[
                      styles.selectOption,
                      index === options.length - 1 && styles.selectOptionLast,
                      active && styles.selectOptionActive,
                    ]}
                    onPress={() => {
                      updateField(field.key, opt.value);
                      setOpenSelectKey(null);
                    }}>
                    <Text
                      style={[
                        styles.selectOptionText,
                        active && styles.selectOptionTextActive,
                      ]}>
                      {opt.label}
                    </Text>
                    {active ? (
                      <Icon name="checkmark-circle" size={18} color="#008178" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      );
    }

    return (
      <View key={field.key} style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {field.required ? <Text style={styles.requiredMark}> *</Text> : null}
        </Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={text => updateField(field.key, text)}
          placeholder={field.placeholder || field.label}
          placeholderTextColor="#9AA7B8"
          keyboardType={field.type === 'tel' ? 'phone-pad' : 'default'}
          autoCapitalize={field.type === 'tel' ? 'none' : 'words'}
        />
      </View>
    );
  };

  const submitting = createWithdrawal.isPending;
  const showLoader = fieldsQuery.isFetching || submitting;
  const canSubmit =
    !!selectedMethod &&
    fields.length > 0 &&
    !fieldsQuery.isFetching &&
    !submitting &&
    !pendingWithdrawal;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title={methodLabel}
        showBack
        onBack={() => navigation?.goBack()}
      />
      <Loader visible={showLoader} overlay />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Withdrawal amount</Text>
            <Text style={styles.summaryValue}>৳{amount.toFixed(2)}</Text>
          </View> */}

          {pendingWithdrawal ? (
            <View style={styles.pendingBanner}>
              <View style={styles.pendingIcon}>
                <Icon name="time-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.pendingText}>
                You already have a pending withdrawal. Wait until it is
                completed or rejected.
              </Text>
            </View>
          ) : null}

          {fieldsQuery.isError ? (
            <TouchableOpacity
              style={styles.errorBox}
              onPress={() => fieldsQuery.refetch()}>
              <Text style={styles.errorBoxText}>
                {fieldsQuery.error?.message || 'Failed to load fields'}
              </Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          ) : (
            !fieldsQuery.isFetching && fields.map(renderField)
          )}

          {!!formError && (
            <View style={styles.formErrorBox}>
              <Icon name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.formError}>{formError}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.92}
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}>
            <LinearGradient
              colors={
                canSubmit ? ['#009E93', '#008178'] : ['#A8C7C3', '#90B3AE']
              }
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.submitGradient}>
              <Text style={styles.submitText}>
                {pendingWithdrawal
                  ? 'Withdrawal pending'
                  : 'Request withdrawal'}
              </Text>

            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WithdrawDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#F0FAF8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D9E8E5',
  },
  summaryLabel: {fontSize: 12, fontWeight: '600', color: '#6B7C8F'},
  summaryValue: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: '#008178',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
  fieldBlock: {marginBottom: 14},
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  requiredMark: {color: '#DC2626'},
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE5EC',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F1A24',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE5EC',
    paddingHorizontal: 14,
    minHeight: 50,
  },
  selectTriggerOpen: {
    borderColor: '#008178',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectValue: {flex: 1, fontSize: 15, color: '#0F1A24', paddingRight: 8},
  selectPlaceholder: {color: '#9AA7B8'},
  chevronPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectMenu: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#008178',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EDF2',
  },
  selectOptionLast: {borderBottomWidth: 0},
  selectOptionActive: {backgroundColor: '#F0FAF8'},
  selectOptionText: {fontSize: 15, color: '#0F1A24'},
  selectOptionTextActive: {color: '#008178', fontWeight: '700'},
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  errorBoxText: {fontSize: 13, color: '#DC2626', lineHeight: 18},
  retryText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#008178',
  },
  formErrorBox: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formError: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitBtnDisabled: {opacity: 0.9},
  submitGradient: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
  },
  submitText: {fontSize: 16, fontWeight: '800', color: '#FFFFFF'},
  submitIcon: {marginLeft: 8},
});
