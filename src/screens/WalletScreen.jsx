import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import WalletSkeleton from '../components/wallet/WalletSkeleton';
import {useWallet, useWithdrawals} from '../api/queries';
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

const getWithdrawalMeta = item => {
  if (item?.bkash_number) {
    return item.bkash_number;
  }
  const details = item?.delivery_details || {};
  if (details.wallet_number) {
    return details.wallet_number;
  }
  if (details.account_number) {
    return details.account_number;
  }
  if (item?.method) {
    return String(item.method);
  }
  return '';
};

const WalletScreen = ({navigation, route}) => {
  const showBack = route?.params?.showBack === true;
  const [showBalance, setShowBalance] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const {data, isLoading, refetch} = useWallet({page: 1, limit: 20});
  const withdrawalsQuery = useWithdrawals({page: 1, limit: 20});
  const wallet = data?.data || {};
  const transactions = Array.isArray(wallet.transactions)
    ? wallet.transactions
    : unwrapList(data);
  const withdrawals = unwrapList(withdrawalsQuery.data);
  const pendingWithdrawal = withdrawals.find(
    item => String(item.status || '').toUpperCase() === 'PENDING',
  );

  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      setShowBalance(false);
      refetch();
      withdrawalsQuery.refetch();
    });
    return unsubscribe;
  }, [navigation, refetch, withdrawalsQuery]);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Wallet"
        showBack={showBack}
        leftIcon={showBack ? undefined : 'wallet-outline'}
        onBack={() => navigation?.goBack()}
      />
      <Loader visible={balanceLoading} overlay />

      {isLoading ? (
        <WalletSkeleton />
      ) : (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#0A8F82', '#067A6E', '#045F56']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.balanceGradient}>
            <View style={styles.decorCircleOne} />
            <View style={styles.decorCircleTwo} />

            <View style={styles.balanceTop}>
              <Icon name="wallet-outline" size={18} color="#B8E8E1" />
              <Text style={styles.balanceLabel}>Available balance</Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.currencySymbol}>৳</Text>
              <Text style={styles.balanceValue}>
                {showBalance
                  ? formatAmount(wallet.balance ?? 0)
                  : '*****'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleBalance}
                style={styles.eyeBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Icon
                  name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#B8E8E1"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.currency}>{wallet.currency || 'BDT'}</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.withdrawBtnWrap}
              onPress={() =>
                navigation?.navigate('Withdraw', {
                  balance: wallet.balance ?? 0,
                  pendingWithdrawal: !!pendingWithdrawal,
                })
              }>
              <LinearGradient
                colors={['#FF6B8A', '#E83E6B']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.withdrawBtn}>
                <View style={styles.withdrawTaka}>
                  <Text style={styles.withdrawTakaText}>৳</Text>
                </View>
                {/* <View style={styles.withdrawDivider} /> */}
                <Text style={styles.withdrawBtnText}>
                  {pendingWithdrawal ? 'View' : 'Withdraw'}
                </Text>
                {/* <Icon name="arrow-forward" size={14} color="#FFFFFF" /> */}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {withdrawals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Withdrawals</Text>
            {withdrawals.map((item, index) => {
              const status = String(item.status || 'PENDING').toUpperCase();
              const meta = getWithdrawalMeta(item);
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
                    <Text style={styles.txTitle}>
                      {status.replace(/_/g, ' ')}
                      {item.method ? ` · ${item.method}` : ''}
                    </Text>
                    <Text style={styles.txMeta}>
                      {formatDate(item.created_at || item.updated_at)}
                      {meta ? ` · ${meta}` : ''}
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

        {transactions.length === 0 ? (
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
      )}
    </SafeAreaView>
  );
};

export default WalletScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  content: {paddingHorizontal: 16, paddingBottom: 28},
  balanceCard: {
    borderRadius: 22,
    marginBottom: 22,
    overflow: 'hidden',
  },
  balanceGradient: {
    minHeight: 168,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 54,
    position: 'relative',
  },
  decorCircleOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -30,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: -35,
    left: -20,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  eyeBtn: {
    marginLeft: 10,
    padding: 2,
  },
  currency: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  withdrawBtnWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 22,
    gap: 8,
  },
  withdrawTaka: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawTakaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E83E6B',
  },
  withdrawDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  withdrawBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
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
});
