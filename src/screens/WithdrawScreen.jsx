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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {useDeliveryMethods} from '../api/queries';

const METHOD_ICONS = {
  MFS: 'phone-portrait-outline',
  BANK: 'business-outline',
};

const WithdrawScreen = ({navigation, route}) => {
  const balance = Number(route?.params?.balance) || 0;
  const pendingWithdrawal = !!route?.params?.pendingWithdrawal;

  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');

  const methodsQuery = useDeliveryMethods();

  const methods = useMemo(() => {
    const list = methodsQuery.data?.data?.methods;
    return Array.isArray(list) ? list : [];
  }, [methodsQuery.data]);

  const validateAmount = () => {
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
    if (parsedAmount > balance) {
      return 'Amount exceeds available balance';
    }
    return '';
  };

  const handleSelectMethod = item => {
    const error = validateAmount();
    if (error) {
      setFormError(error);
      return;
    }

    navigation?.navigate('WithdrawDetails', {
      amount: Number(amount),
      balance,
      pendingWithdrawal,
      method: item.method,
      methodLabel: item.label || item.method,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Withdraw Money"
        showBack
        onBack={() => navigation?.goBack()}
      />
      <Loader visible={methodsQuery.isFetching} overlay />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
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
          <Text style={styles.hint}>
            Available ৳{balance.toFixed(2)} · Minimum ৳100
          </Text>

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
              return (
                <TouchableOpacity
                  key={item.method}
                  activeOpacity={0.9}
                  disabled={pendingWithdrawal}
                  style={[
                    styles.methodCard,
                    pendingWithdrawal && styles.methodCardDisabled,
                  ]}
                  onPress={() => handleSelectMethod(item)}>
                  <View style={styles.methodIcon}>
                    <Icon
                      name={METHOD_ICONS[item.method] || 'wallet-outline'}
                      size={22}
                      color="#008178"
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
    
                  </View>
                  <Icon name="chevron-forward" size={18} color="#9AA7B8" />
                </TouchableOpacity>
              );
            })
          )}

          {!!formError && (
            <View style={styles.formErrorBox}>
              <Icon name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.formError}>{formError}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WithdrawScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D9E8E5',
    paddingHorizontal: 16,
    minHeight: 30,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '500',
    color: '#008178',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F1A24',
    // paddingVertical: 14,
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
  methodCardDisabled: {opacity: 0.5},
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {flex: 1, minWidth: 0, paddingRight: 8},
  methodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F1A24',
  },
  methodDesc: {
    marginTop: 3,
    fontSize: 12,
    color: '#8190A7',
    lineHeight: 17,
  },
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
});
