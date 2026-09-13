import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';

const MedicineThumb = ({image}) => {
  if (image) {
    return <Image source={{uri: image}} style={styles.thumb} />;
  }

  return (
    <View style={styles.thumbPlaceholder}>
      <Icon name="medkit-outline" size={24} color="#008178" />
    </View>
  );
};

const CartScreen = ({navigation, route}) => {
  const {cart = {}, medicines = []} = route?.params || {};
  const [localCart, setLocalCart] = useState(cart);

  const updateQuantity = (medicineId, delta) => {
    setLocalCart(prev => {
      const next = {...prev};
      const current = next[medicineId] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        delete next[medicineId];
      } else {
        next[medicineId] = updated;
      }
      return next;
    });
  };

  const removeItem = medicineId => {
    setLocalCart(prev => {
      const next = {...prev};
      delete next[medicineId];
      return next;
    });
  };

  const cartItems = Object.entries(localCart)
    .map(([id, quantity]) => {
      const medicine = medicines.find(m => m.id === parseInt(id, 10));
      if (!medicine) {
        return null;
      }
      return {...medicine, quantity};
    })
    .filter(Boolean);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="My cart" onBack={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="cart-outline" size={32} color="#008178" />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Add medicines to continue shopping
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.shopBtn}
              onPress={() => navigation?.navigate('Medicine')}>
              <Text style={styles.shopBtnText}>Browse medicines</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.countLabel}>
              {itemCount} item{itemCount > 1 ? 's' : ''} in cart
            </Text>

            {cartItems.map(item => (
              <View key={item.id} style={styles.card}>
                <MedicineThumb image={item.image} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.removeBtn}
                      onPress={() => removeItem(item.id)}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <Icon name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.description} numberOfLines={1}>
                    {item.description}
                  </Text>

                  <View style={styles.cardBottom}>
                    <Text style={styles.price}>
                      ৳{item.price * item.quantity}
                    </Text>

                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, -1)}>
                        <Icon name="remove" size={16} color="#008178" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, 1)}>
                        <Icon name="add" size={16} color="#008178" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>৳{totalPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>৳50</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalValue}>৳{totalPrice + 50}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>Total</Text>
            <Text style={styles.bottomPrice}>৳{totalPrice + 50}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.checkoutBtn}
            onPress={() =>
              navigation?.navigate('Checkout', {
                cart: localCart,
                medicines,
              })
            }>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
            <Icon name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
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
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#8190A7',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopBtn: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  countLabel: {
    fontSize: 13,
    color: '#8190A7',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  thumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111820',
    paddingRight: 8,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 12,
    color: '#8190A7',
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111820',
    minWidth: 16,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8190A7',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: 12,
    marginTop: 2,
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
  checkoutBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#008178',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
