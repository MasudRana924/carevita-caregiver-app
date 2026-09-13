import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiRequest} from '../services/api';

const PaymentScreen = ({route, navigation}) => {
  const {bookingId, amount, bookingNumber} = route.params || {};
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const processPayment = async paymentMethod => {
    if (!bookingId) {
      Alert.alert('Error', 'Missing booking information');
      return;
    }

    if (paymentMethod === 'bkash') {
      navigation.navigate('BkashCheckout', {bookingId});
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/payments/wallet', 'POST', {
        amount,
        booking_id: bookingId,
      });

      if (response.success) {
        Alert.alert('Success', 'Payment processed successfully', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingDetails', {bookingId}),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBkashPayment = () => {
    setSelectedMethod('bkash');
    processPayment('bkash');
  };

  const handleWalletPayment = () => {
    setSelectedMethod('wallet');
    processPayment('wallet');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#111820" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Booking Number</Text>
            <Text style={styles.summaryValue}>{bookingNumber || 'N/A'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{amount || 0} BDT</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity
          style={[
            styles.paymentMethod,
            selectedMethod === 'bkash' && styles.selectedMethod,
          ]}
          onPress={handleBkashPayment}
          disabled={loading}>
          <View style={styles.methodIcon}>
            <Icon name="card" size={24} color="#E2136E" />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>bKash</Text>
            <Text style={styles.methodDescription}>
              Pay with your bKash account
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#8190A7" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentMethod,
            selectedMethod === 'wallet' && styles.selectedMethod,
          ]}
          onPress={handleWalletPayment}
          disabled={loading}>
          <View style={styles.methodIcon}>
            <Icon name="wallet" size={24} color="#008178" />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Wallet</Text>
            <Text style={styles.methodDescription}>
              Pay with your Nirapod wallet
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#8190A7" />
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008178" />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111820',
    textAlign: 'center',
    marginRight: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8190A7',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111820',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E3E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  selectedMethod: {
    borderColor: '#008178',
    backgroundColor: '#E6F4F3',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#8190A7',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8190A7',
  },
});

export default PaymentScreen;
