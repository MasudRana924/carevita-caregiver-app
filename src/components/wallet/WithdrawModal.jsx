import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../common/Loader';
import {
  useDeliveryMethods,
  useDeliveryMethodFields,
} from '../../api/queries';
import {useCreateWithdrawal} from '../../api/mutations';

const METHOD_ICONS = {
  MFS: 'phone-portrait-outline',
  BANK: 'business-outline',
};

const WithdrawModal = ({
  visible,
  onClose,
  balance = 0,
  pendingWithdrawal = false,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [openSelectKey, setOpenSelectKey] = useState(null);
  const [formError, setFormError] = useState('');

  const methodsQuery = useDeliveryMethods({enabled: visible});
  const fieldsQuery = useDeliveryMethodFields(selectedMethod, {
    enabled: visible && !!selectedMethod,
  });
  const createWithdrawal = useCreateWithdrawal();

  const methods = useMemo(() => {
    const list = methodsQuery.data?.data?.methods;
    return Array.isArray(list) ? list : [];
  }, [methodsQuery.data]);

  const fields = useMemo(() => {
    const list = fieldsQuery.data?.data?.fields;
    return Array.isArray(list) ? list : [];
  }, [fieldsQuery.data]);

  const methodLabel =
    fieldsQuery.data?.data?.label ||
    methods.find(item => item.method === selectedMethod)?.label ||
    selectedMethod;

  useEffect(() => {
    if (!visible) {
      setAmount('');
      setSelectedMethod(null);
      setFieldValues({});
      setOpenSelectKey(null);
      setFormError('');
    }
  }, [visible]);

  useEffect(() => {
    setFieldValues({});
    setOpenSelectKey(null);
    setFormError('');
  }, [selectedMethod]);

  const availableBalance = Number(balance) || 0;

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
    const parsedAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'Enter a valid withdrawal amount';
    }
    if (parsedAmount < 100) {
      return 'Minimum withdrawal amount is ৳100';
    }
    if (parsedAmount > availableBalance) {
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
        amount: Number(amount),
        method: selectedMethod,
        delivery_details,
      });
      onSuccess?.(response);
      onClose?.();
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
            {field.required ? ' *' : ''}
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
            <Icon
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#8190A7"
            />
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
                    {active && (
                      <Icon name="checkmark" size={16} color="#008178" />
                    )}
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
          {field.required ? ' *' : ''}
        </Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={text => updateField(field.key, text)}
          placeholder={field.placeholder || field.label}
          placeholderTextColor="#8190A7"
          keyboardType={field.type === 'tel' ? 'phone-pad' : 'default'}
          autoCapitalize={field.type === 'tel' ? 'none' : 'words'}
        />
      </View>
    );
  };

  const submitting = createWithdrawal.isPending;
  const showLoader =
    visible &&
    (methodsQuery.isFetching ||
      (!!selectedMethod && fieldsQuery.isFetching) ||
      submitting);
  const canSubmit =
    !!selectedMethod &&
    fields.length > 0 &&
    !fieldsQuery.isFetching &&
    !submitting &&
    !pendingWithdrawal;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View
            style={[
              styles.sheet,
              {paddingBottom: Math.max(insets.bottom, 16) + 8},
            ]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Withdraw</Text>
                <Text style={styles.subtitle}>
                  Available ৳{availableBalance.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Icon name="close" size={20} color="#4A5568" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}>
              {pendingWithdrawal ? (
                <View style={styles.pendingBanner}>
                  <Icon name="time-outline" size={18} color="#D97706" />
                  <Text style={styles.pendingText}>
                    You already have a pending withdrawal. Wait until it is
                    completed or rejected.
                  </Text>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>Amount</Text>
              <View style={styles.amountWrap}>
                <Text style={styles.currencyPrefix}>৳</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={text => {
                    setAmount(text.replace(/[^0-9.]/g, ''));
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="decimal-pad"
                  editable={!pendingWithdrawal}
                />
              </View>
              <Text style={styles.hint}>Minimum ৳100</Text>

              <Text style={[styles.sectionLabel, styles.sectionGap]}>
                Delivery method
              </Text>

              {methodsQuery.isError ? (
                <TouchableOpacity
                  style={styles.errorBox}
                  onPress={() => methodsQuery.refetch()}>
                  <Text style={styles.errorBoxText}>
                    {methodsQuery.error?.message || 'Failed to load methods'}
                  </Text>
                  <Text style={styles.retryText}>Tap to retry</Text>
                </TouchableOpacity>
              ) : (
                methods.map(item => {
                  const active = selectedMethod === item.method;
                  return (
                    <TouchableOpacity
                      key={item.method}
                      activeOpacity={0.88}
                      disabled={pendingWithdrawal}
                      style={[
                        styles.methodCard,
                        active && styles.methodCardActive,
                        pendingWithdrawal && styles.methodCardDisabled,
                      ]}
                      onPress={() => setSelectedMethod(item.method)}>
                      <View
                        style={[
                          styles.methodIcon,
                          active && styles.methodIconActive,
                        ]}>
                        <Icon
                          name={METHOD_ICONS[item.method] || 'wallet-outline'}
                          size={20}
                          color={active ? '#008178' : '#4A5568'}
                        />
                      </View>
                      <View style={styles.methodInfo}>
                        <Text
                          style={[
                            styles.methodLabel,
                            active && styles.methodLabelActive,
                          ]}>
                          {item.label}
                        </Text>
                        {!!item.description && (
                          <Text style={styles.methodDesc}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {selectedMethod && !fieldsQuery.isFetching && (
                <>
                  <Text style={[styles.sectionLabel, styles.sectionGap]}>
                    {methodLabel} details
                  </Text>

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
                    fields.map(renderField)
                  )}
                </>
              )}

              {!!formError && <Text style={styles.formError}>{formError}</Text>}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              disabled={!canSubmit}
              onPress={handleSubmit}>
              <Text style={styles.submitText}>
                {pendingWithdrawal
                  ? 'Withdrawal pending'
                  : 'Request withdrawal'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Loader visible={showLoader} />
    </>
  );
};

export default WithdrawModal;

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 32, 0.48)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D8DEE6',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {fontSize: 20, fontWeight: '700', color: '#111820'},
  subtitle: {marginTop: 4, fontSize: 13, color: '#8190A7'},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {paddingBottom: 16},
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF4E5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionGap: {marginTop: 18},
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    paddingHorizontal: 14,
    minHeight: 56,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: '#008178',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#111820',
    paddingVertical: 12,
  },
  hint: {marginTop: 8, fontSize: 12, color: '#8190A7'},
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
    padding: 14,
    marginBottom: 10,
  },
  methodCardActive: {
    backgroundColor: '#EAF7F5',
    borderColor: '#008178',
  },
  methodCardDisabled: {opacity: 0.55},
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconActive: {backgroundColor: '#D7F0ED'},
  methodInfo: {flex: 1, minWidth: 0, paddingRight: 8},
  methodLabel: {fontSize: 15, fontWeight: '700', color: '#111820'},
  methodLabelActive: {color: '#008178'},
  methodDesc: {
    marginTop: 3,
    fontSize: 12,
    color: '#8190A7',
    lineHeight: 17,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C5CDD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {borderColor: '#008178'},
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#008178',
  },
  fieldBlock: {marginBottom: 14},
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111820',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    paddingHorizontal: 14,
    minHeight: 50,
  },
  selectTriggerOpen: {
    borderColor: '#008178',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectValue: {flex: 1, fontSize: 15, color: '#111820', paddingRight: 8},
  selectPlaceholder: {color: '#8190A7'},
  selectMenu: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#008178',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
  selectOptionActive: {backgroundColor: '#EAF7F5'},
  selectOptionText: {fontSize: 15, color: '#111820'},
  selectOptionTextActive: {color: '#008178', fontWeight: '600'},
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  errorBoxText: {fontSize: 13, color: '#DC2626', lineHeight: 18},
  retryText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#008178',
  },
  formError: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: '#008178',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {opacity: 0.45},
  submitText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
});
