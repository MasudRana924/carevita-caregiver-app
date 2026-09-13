import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';

const PaymentHistory = ({navigation}) => {
  // Sample payment history data - replace with actual API call
  const payments = [
    {
      id: 1,
      bookingNumber: 'BK-2024-001',
      amount: 500,
      status: 'completed',
      method: 'bKash',
      date: '2024-01-15',
    },
    {
      id: 2,
      bookingNumber: 'BK-2024-002',
      amount: 750,
      status: 'completed',
      method: 'wallet',
      date: '2024-01-10',
    },
    {
      id: 3,
      bookingNumber: 'BK-2024-003',
      amount: 600,
      status: 'pending',
      method: 'bKash',
      date: '2024-01-08',
    },
  ];

  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return '#00C853';
      case 'pending':
        return '#FFA000';
      case 'failed':
        return '#FF5252';
      default:
        return '#8190A7';
    }
  };

  const getMethodIcon = method => {
    switch (method) {
      case 'bKash':
        return 'card';
      case 'wallet':
        return 'wallet';
      default:
        return 'cash';
    }
  };

  const formatAmount = amount => {
    return `${amount} BDT`;
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Payment History" showBack={true} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="card-outline" size={32} color="#008178" />
            </View>
            <Text style={styles.emptyTitle}>No payment history</Text>
            <Text style={styles.emptyText}>
              Your payment history will show up here
            </Text>
          </View>
        ) : (
          payments.map(payment => (
            <TouchableOpacity
              key={payment.id}
              style={styles.paymentCard}
              onPress={() =>
                navigation.navigate('BookingDetails', {
                  bookingId: payment.id,
                })
              }>
              <View style={styles.cardHeader}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingNumber}>
                    {payment.bookingNumber}
                  </Text>
                  <Text style={styles.date}>{formatDate(payment.date)}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getStatusColor(payment.status) + '20'},
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      {color: getStatusColor(payment.status)},
                    ]}>
                    {payment.status.charAt(0).toUpperCase() +
                      payment.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.amountRow}>
                  <View style={styles.methodInfo}>
                    <Icon
                      name={getMethodIcon(payment.method)}
                      size={20}
                      color="#008178"
                    />
                    <Text style={styles.methodText}>
                      {payment.method.charAt(0).toUpperCase() +
                        payment.method.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111820',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#8190A7',
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#8190A7',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#E3E8F0',
    paddingTop: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodText: {
    fontSize: 14,
    color: '#303944',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#008178',
  },
});

export default PaymentHistory;
