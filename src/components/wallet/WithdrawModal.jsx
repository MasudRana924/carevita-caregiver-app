import React, {useEffect, useMemo, useRef, useState} from 'react';
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
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../common/Loader';
import {
  useDeliveryMethods,
  useDeliveryMethodFields,
} from '../../api/queries';
import {useCreateWithdrawal} from '../../api/mutations';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_MAX = Math.min(SCREEN_HEIGHT * 0.9, 720);

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
  const [mounted, setMounted] = useState(visible);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SHEET_MAX)).current;

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
    if (visible) {
      setMounted(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(SHEET_MAX);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: SHEET_MAX,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) {
        setMounted(false);
        setAmount('');
        setSelectedMethod(null);
        setFieldValues({});
        setOpenSelectKey(null);
        setFormError('');
      }
    });
  }, [visible, backdropAnim, sheetAnim, mounted]);

  useEffect(() => {
    setFieldValues({});
    setOpenSelectKey(null);
    setFormError('');
  }, [selectedMethod]);

  const availableBalance = Number(balance) || 0;
  const step = !selectedMethod ? 1 : 2;

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
  const showLoader =
    mounted &&
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
        visible={mounted}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent>
        {mounted ? (
          <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View
              style={[
                styles.backdrop,
                {
                  opacity: backdropAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View
              style={[
                styles.sheetWrap,
                {
                  transform: [{translateY: sheetAnim}],
                  paddingBottom: Math.max(insets.bottom, 12),
                },
              ]}>
              <View style={styles.sheet}>
                <View style={styles.handleRow}>
                  <View style={styles.handle} />
                </View>

                <LinearGradient
                  colors={['#E8F7F5', '#FFFFFF']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.hero}>
                  <Text style={styles.title}>Withdraw Money</Text>
                </LinearGradient>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  contentContainerStyle={styles.scrollContent}>
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

                  <Text style={styles.sectionLabel}>Amount</Text>
                  <View style={styles.amountCard}>
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
                      placeholderTextColor="#C0CAD6"
                      keyboardType="decimal-pad"
                      editable={!pendingWithdrawal}
                    />
                  </View>
                  <Text style={styles.hint}>Minimum withdrawal ৳100</Text>

                  <Text style={[styles.sectionLabel, styles.sectionGap]}>
                    Delivery method
                  </Text>

                  {methodsQuery.isError ? (
                    <TouchableOpacity
                      style={styles.errorBox}
                      onPress={() => methodsQuery.refetch()}>
                      <Text style={styles.errorBoxText}>
                        {methodsQuery.error?.message ||
                          'Failed to load methods'}
                      </Text>
                      <Text style={styles.retryText}>Tap to retry</Text>
                    </TouchableOpacity>
                  ) : (
                    methods.map(item => {
                      const active = selectedMethod === item.method;
                      return (
                        <TouchableOpacity
                          key={item.method}
                          activeOpacity={0.9}
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
                              name={
                                METHOD_ICONS[item.method] || 'wallet-outline'
                              }
                              size={22}
                              color={active ? '#FFFFFF' : '#008178'}
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
                              <Text
                                style={styles.methodDesc}
                                numberOfLines={2}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                          <View
                            style={[
                              styles.radio,
                              active && styles.radioActive,
                            ]}>
                            {active ? <View style={styles.radioDot} /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}

                  {selectedMethod && !fieldsQuery.isFetching ? (
                    <View style={styles.detailsCard}>
                      <View style={styles.detailsHeader}>
                        <Text style={styles.detailsTitle}>
                          {methodLabel} details
                        </Text>
                        <TouchableOpacity
                          onPress={() => setSelectedMethod(null)}
                          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                          <Text style={styles.changeLink}>Change</Text>
                        </TouchableOpacity>
                      </View>

                      {fieldsQuery.isError ? (
                        <TouchableOpacity
                          style={styles.errorBox}
                          onPress={() => fieldsQuery.refetch()}>
                          <Text style={styles.errorBoxText}>
                            {fieldsQuery.error?.message ||
                              'Failed to load fields'}
                          </Text>
                          <Text style={styles.retryText}>Tap to retry</Text>
                        </TouchableOpacity>
                      ) : (
                        fields.map(renderField)
                      )}
                    </View>
                  ) : null}

                  {!!formError && (
                    <View style={styles.formErrorBox}>
                      <Icon
                        name="alert-circle-outline"
                        size={16}
                        color="#DC2626"
                      />
                      <Text style={styles.formError}>{formError}</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity
                    activeOpacity={0.92}
                    style={[
                      styles.submitBtn,
                      !canSubmit && styles.submitBtnDisabled,
                    ]}
                    disabled={!canSubmit}
                    onPress={handleSubmit}>
                    <LinearGradient
                      colors={
                        canSubmit
                          ? ['#009E93', '#008178']
                          : ['#A8C7C3', '#90B3AE']
                      }
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.submitGradient}>
                      <Text style={styles.submitText}>
                        {pendingWithdrawal
                          ? 'Withdrawal pending'
                          : 'Request withdrawal'}
                      </Text>
                      {!pendingWithdrawal ? (
                        <Icon
                          name="arrow-forward"
                          size={18}
                          color="#FFFFFF"
                          style={styles.submitIcon}
                        />
                      ) : null}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.loaderOverlay,
                    !showLoader && styles.loaderHidden,
                  ]}
                  pointerEvents={showLoader ? 'auto' : 'none'}>
                  <Loader visible={showLoader} overlay={false} size={44} />
                </View>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        ) : (
          <View />
        )}
      </Modal>
    </>
  );
};

export default WithdrawModal;

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 18, 28, 0.55)',
  },
  sheetWrap: {
    maxHeight: SHEET_MAX,
    width: '100%',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: SHEET_MAX,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0A121C',
        shadowOffset: {width: 0, height: -8},
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {elevation: 24},
    }),
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  loaderHidden: {
    opacity: 0,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#E8F7F5',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 129, 120, 0.28)',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008178',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F1A24',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#5B6B7C',
    lineHeight: 18,
  },
  balancePill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 129, 120, 0.12)',
  },
  balancePillLabel: {fontSize: 12, color: '#8190A7', fontWeight: '600'},
  balancePillValue: {fontSize: 16, fontWeight: '800', color: '#008178'},
  steps: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9D8D5',
  },
  stepDotActive: {backgroundColor: '#008178'},
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: '#C9D8D5',
    marginHorizontal: 6,
  },
  stepLineActive: {backgroundColor: '#008178'},
  stepCaption: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#008178',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7C8F',
    marginBottom: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionGap: {marginTop: 20},
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8F7',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D9E8E5',
    paddingHorizontal: 16,
    minHeight: 64,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: '#008178',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#0F1A24',
    paddingVertical: 14,
  },
  hint: {marginTop: 8, fontSize: 12, color: '#8A97A8'},
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4EBF0',
    padding: 14,
    marginBottom: 10,
  },
  methodCardActive: {
    backgroundColor: '#F0FAF8',
    borderColor: '#008178',
  },
  methodCardDisabled: {opacity: 0.5},
  methodIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E8F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconActive: {backgroundColor: '#008178'},
  methodInfo: {flex: 1, minWidth: 0, paddingRight: 8},
  methodLabel: {fontSize: 15, fontWeight: '700', color: '#0F1A24'},
  methodLabelActive: {color: '#008178'},
  methodDesc: {
    marginTop: 3,
    fontSize: 12,
    color: '#8190A7',
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C9D4DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {borderColor: '#008178'},
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#008178',
  },
  detailsCard: {
    marginTop: 8,
    backgroundColor: '#F7FAFA',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E3EEEE',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsTitle: {fontSize: 14, fontWeight: '700', color: '#0F1A24'},
  changeLink: {fontSize: 13, fontWeight: '700', color: '#008178'},
  fieldBlock: {marginBottom: 12},
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EEF2',
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
