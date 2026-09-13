import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';

const PAYMENT_OPTIONS = [
  {
    id: 'bkash',
    label: 'bKash',
    subtitle: 'Mobile wallet',
    icon: 'wallet-outline',
    tone: '#E2136E',
  },
  {
    id: 'cod',
    label: 'Cash on delivery',
    subtitle: 'Pay when you receive',
    icon: 'cash-outline',
    tone: '#008178',
  },
];

const CheckoutScreen = ({navigation, route}) => {
  const {cart = {}, medicines = []} = route?.params || {};
  const [selectedPayment, setSelectedPayment] = useState('bkash');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => {
      const medicine = medicines.find(m => m.id === parseInt(id, 10));
      if (!medicine) {
        return null;
      }
      return {...medicine, quantity};
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (!address.trim()) {
      Alert.alert('Missing address', 'Please enter your delivery address');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Missing phone', 'Please enter your phone number');
      return;
    }

    navigation?.navigate('BookingConfirmed', {
      message: 'Your medicine order has been placed successfully.',
      status: 'CONFIRMED',
      bookingNumber: `MED-${Date.now().toString().slice(-6)}`,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Checkout" onBack={() => navigation?.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Delivery details</Text>

          <Text style={styles.label}>Address</Text>
          <View style={styles.inputBox}>
            <Icon name="location-outline" size={18} color="#8190A7" />
            <TextInput
              style={styles.input}
              placeholder="House, road, area"
              placeholderTextColor="#8190A7"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputBox}>
            <Icon name="call-outline" size={18} color="#8190A7" />
            <TextInput
              style={styles.input}
              placeholder="01XXXXXXXXX"
              placeholderTextColor="#8190A7"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <View style={[styles.inputBox, styles.noteBox]}>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Delivery instructions..."
              placeholderTextColor="#8190A7"
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionTitle}>Payment method</Text>
          {PAYMENT_OPTIONS.map(option => {
            const selected = selectedPayment === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.85}
                style={[styles.paymentCard, selected && styles.paymentSelected]}
                onPress={() => setSelectedPayment(option.id)}>
                <View
                  style={[
                    styles.paymentIcon,
                    {backgroundColor: `${option.tone}14`},
                  ]}>
                  <Icon name={option.icon} size={20} color={option.tone} />
                </View>
                <View style={styles.paymentText}>
                  <Text style={styles.paymentLabel}>{option.label}</Text>
                  <Text style={styles.paymentSubtitle}>{option.subtitle}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selected && styles.radioSelected,
                  ]}>
                  {selected && (
                    <Icon name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionTitle}>Order summary</Text>
          <View style={styles.summaryCard}>
            {cartItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index === cartItems.length - 1 && styles.itemRowLast,
                ]}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemQty}>Qty {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  ৳{item.price * item.quantity}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.muted}>Subtotal</Text>
              <Text style={styles.value}>৳{subtotal}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Delivery fee</Text>
              <Text style={styles.value}>৳{deliveryFee}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowLast]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>৳{total}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>Payable</Text>
            <Text style={styles.bottomPrice}>৳{total}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.placeBtn}
            onPress={handlePlaceOrder}>
            <Text style={styles.placeBtnText}>Place order</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 14,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 8,
  },
  inputBox: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },
  noteBox: {
    height: 88,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#111820',
    paddingVertical: 0,
  },
  noteInput: {
    height: '100%',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E3E8F0',
    padding: 14,
    marginBottom: 10,
  },
  paymentSelected: {
    borderColor: '#008178',
    backgroundColor: '#E6F4F3',
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentText: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#8190A7',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C8D0DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#008178',
    borderColor: '#008178',
  },
  summaryCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  itemRowLast: {
    marginBottom: 4,
  },
  itemLeft: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
    color: '#8190A7',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111820',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRowLast: {
    marginBottom: 0,
    marginTop: 4,
  },
  muted: {
    fontSize: 14,
    color: '#8190A7',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111820',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#008178',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    backgroundColor: '#FFFFFF',
  },
  bottomLabel: {
    fontSize: 12,
    color: '#8190A7',
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111820',
  },
  placeBtn: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
