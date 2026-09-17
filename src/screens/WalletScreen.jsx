import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {useWallet, useWithdrawals} from '../api/queries';
import {useCreateWithdrawal} from '../api/mutations';
import {unwrapList} from '../api/envelope';

const formatAmount = value => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return String(value ?? '0');
  }
  return num.toFixed(2);
};

const formatDate = value => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const WalletScreen = ({navigation, route}) => {
  const showBack = route?.params?.showBack === true;
  const {data, isLoading, refetch} = useWallet({page: 1, limit: 20});
  const withdrawalsQuery = useWithdrawals({page: 1, limit: 20});
  const createWithdrawal = useCreateWithdrawal();
  const wallet = data?.data || {};
  const transactions = Array.isArray(wallet.transactions)
    ? wallet.transactions
    : unwrapList(data);
  const withdrawals = unwrapList(withdrawalsQuery.data);
  const pendingWithdrawal = withdrawals.find(
    item => String(item.status || '').toUpperCase() === 'PENDING',
  );
  const [showBalance, setShowBalance] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');

  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      setShowBalance(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleToggleBalance = async () => {
    if (!showBalance) {
      setBalanceLoading(true);
      try {
        await refetch();
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setBalanceLoading(false);
      }
    }
    setShowBalance(!showBalance);
  };

  const handleWithdraw = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100) {
      Alert.alert('Minimum ৳100', 'Enter an amount of at least 100 BDT.');
      return;
    }
    if (!bkashNumber.trim()) {
      Alert.alert('Required', 'Enter your bKash number');
      return;
    }
    if (pendingWithdrawal) {
      Alert.alert(
        'Pending withdrawal',
        'Wait until your current withdrawal is completed or rejected.',
      );
      return;
    }
    try {
      await createWithdrawal.mutateAsync({
        amount: value,
        bkash_number: bkashNumber.trim(),
      });
      setAmount('');
      Alert.alert('Requested', 'Withdrawal request submitted');
      withdrawalsQuery.refetch();
      refetch();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to request withdrawal');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Wallet"
        showBack={showBack}
        onBack={() => navigation?.goBack()}
      />
      <Loader visible={balanceLoading || createWithdrawal.isPending} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleBalance}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#D7F0ED"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceValue}>
            {showBalance ? `৳${formatAmount(wallet.balance ?? 0)}` : '৳****'}
          </Text>
          <Text style={styles.currency}>
            {wallet.currency || 'BDT'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Withdraw</Text>
        <View style={styles.withdrawCard}>
          <Text style={styles.withdrawHint}>
            Minimum ৳100. One pending request at a time.
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            placeholderTextColor="#8190A7"
            keyboardType="numeric"
            editable={!pendingWithdrawal}
          />
          <TextInput
            style={styles.input}
            value={bkashNumber}
            onChangeText={setBkashNumber}
            placeholder="bKash number"
            placeholderTextColor="#8190A7"
            keyboardType="phone-pad"
            editable={!pendingWithdrawal}
          />
          <TouchableOpacity
            style={[
              styles.withdrawBtn,
              pendingWithdrawal && styles.withdrawBtnDisabled,
            ]}
            activeOpacity={0.85}
            disabled={!!pendingWithdrawal}
            onPress={handleWithdraw}>
            <Text style={styles.withdrawBtnText}>
              {pendingWithdrawal ? 'Withdrawal pending' : 'Request withdrawal'}
            </Text>
          </TouchableOpacity>
        </View>

        {withdrawals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Withdrawals</Text>
            {withdrawals.map((item, index) => {
              const status = String(item.status || 'PENDING').toUpperCase();
              return (
                <View key={item.id || index} style={styles.txCard}>
                  <View
                    style={[
                      styles.txIcon,
                      {
                        backgroundColor:
                          status === 'COMPLETED'
                            ? '#E6F4F3'
                            : status === 'REJECTED'
                              ? '#FEECEC'
                              : '#FFF4E5',
                      },
                    ]}>
                    <Icon
                      name="cash-outline"
                      size={18}
                      color={
                        status === 'COMPLETED'
                          ? '#008178'
                          : status === 'REJECTED'
                            ? '#DC2626'
                            : '#D97706'
                      }
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{status.replace(/_/g, ' ')}</Text>
                    <Text style={styles.txMeta}>
                      {formatDate(item.created_at || item.updated_at)}
                      {item.bkash_number ? ` · ${item.bkash_number}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.txAmount}>
                    ৳{formatAmount(item.amount)}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        <Text style={styles.sectionTitle}>Transactions</Text>

        {isLoading ? (
          <Text style={styles.emptyText}>Loading wallet...</Text>
        ) : transactions.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="wallet-outline" size={40} color="#008178" />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>
              Earnings are credited here when you complete a booking.
            </Text>
          </View>
        ) : (
          transactions.map((item, index) => {
            const credit = item.direction === 'CREDIT';
            return (
              <View
                key={item.id || `${item.booking_id}-${index}`}
                style={styles.txCard}>
                <View
                  style={[
                    styles.txIcon,
                    {backgroundColor: credit ? '#E6F4F3' : '#FEECEC'},
                  ]}>
                  <Icon
                    name={credit ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={credit ? '#008178' : '#DC2626'}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>
                    {(item.category || item.direction || 'Transaction').replace(
                      /_/g,
                      ' ',
                    )}
                  </Text>
                  <Text style={styles.txMeta}>
                    {formatDate(item.created_at)}
                    {item.booking_id ? ' · Booking credit' : ''}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      {color: credit ? '#008178' : '#DC2626'},
                    ]}>
                    {credit ? '+' : '-'}৳{formatAmount(item.amount)}
                  </Text>
                  {item.balance_after != null && (
                    <Text style={styles.txBalance}>
                      Bal ৳{formatAmount(item.balance_after)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WalletScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  content: {paddingHorizontal: 16, paddingBottom: 28},
  balanceCard: {
    backgroundColor: '#008178',
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {fontSize: 13, color: '#D7F0ED'},
  balanceValue: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currency: {marginTop: 6, fontSize: 13, color: '#D7F0ED'},
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 12,
  },
  empty: {alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24},
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: '#8190A7',
    textAlign: 'center',
    lineHeight: 20,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {flex: 1, minWidth: 0},
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    textTransform: 'capitalize',
  },
  txMeta: {marginTop: 3, fontSize: 12, color: '#8190A7'},
  txRight: {alignItems: 'flex-end'},
  txAmount: {fontSize: 14, fontWeight: '700'},
  txBalance: {marginTop: 3, fontSize: 11, color: '#8190A7'},
  withdrawCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  withdrawHint: {
    fontSize: 12,
    color: '#8190A7',
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111820',
    marginBottom: 10,
  },
  withdrawBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnDisabled: {backgroundColor: '#9BB8B0'},
  withdrawBtnText: {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
});
