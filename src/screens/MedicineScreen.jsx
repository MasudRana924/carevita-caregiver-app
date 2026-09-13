import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';

const medicines = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    description: 'Pain reliever & fever reducer',
    price: 25,
    image: null,
    category: 'Pain Relief',
  },
  {
    id: 2,
    name: 'Amoxicillin 250mg',
    description: 'Antibiotic for infections',
    price: 120,
    image: null,
    category: 'Antibiotics',
  },
  {
    id: 3,
    name: 'Omeprazole 20mg',
    description: 'Acid reflux & heartburn',
    price: 85,
    image: null,
    category: 'Digestive',
  },
  {
    id: 4,
    name: 'Metformin 500mg',
    description: 'Diabetes management',
    price: 45,
    image: null,
    category: 'Diabetes',
  },
  {
    id: 5,
    name: 'Cetirizine 10mg',
    description: 'Allergy relief',
    price: 35,
    image: null,
    category: 'Allergy',
  },
  {
    id: 6,
    name: 'Ibuprofen 400mg',
    description: 'Anti-inflammatory pain relief',
    price: 40,
    image: null,
    category: 'Pain Relief',
  },
  {
    id: 7,
    name: 'Vitamin D3 1000IU',
    description: 'Bone health supplement',
    price: 150,
    image: null,
    category: 'Supplements',
  },
  {
    id: 8,
    name: 'Aspirin 75mg',
    description: 'Blood thinner',
    price: 30,
    image: null,
    category: 'Heart',
  },
];

const categories = [
  'All',
  'Pain Relief',
  'Antibiotics',
  'Digestive',
  'Supplements',
  'Diabetes',
  'Allergy',
  'Heart',
];

const MedicineThumb = ({image, size = 64}) => {
  if (image) {
    return (
      <Image
        source={{uri: image}}
        style={{width: size, height: size, borderRadius: 14}}
      />
    );
  }

  return (
    <View
      style={[
        styles.thumbPlaceholder,
        {width: size, height: size, borderRadius: size * 0.22},
      ]}>
      <Icon name="medkit-outline" size={size * 0.38} color="#008178" />
    </View>
  );
};

const MedicineScreen = ({navigation}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState('');

  const filteredMedicines = medicines.filter(item => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const addToCart = medicine => {
    setCart(prev => ({
      ...prev,
      [medicine.id]: (prev[medicine.id] || 0) + 1,
    }));
  };

  const removeFromCart = medicineId => {
    setCart(prev => {
      const next = {...prev};
      if (next[medicineId] > 1) {
        next[medicineId]--;
      } else {
        delete next[medicineId];
      }
      return next;
    });
  };

  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, count]) => {
    const medicine = medicines.find(m => m.id === parseInt(id, 10));
    return sum + (medicine ? medicine.price * count : 0);
  }, 0);

  const goToCart = () => navigation?.navigate('Cart', {cart, medicines});

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Medicines"
        onBack={() => navigation?.goBack()}
        rightComponent={
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cartHeaderBtn}
            onPress={goToCart}>
            <Icon name="cart-outline" size={22} color="#111820" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={18} color="#8190A7" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines..."
            placeholderTextColor="#8190A7"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearch('')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon name="close-circle" size={18} color="#8190A7" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        style={styles.categoryList}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}>
        {categories.map(category => {
          const active = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              activeOpacity={0.85}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category)}>
              <Text
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}>
        {filteredMedicines.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="search-outline" size={28} color="#008178" />
            </View>
            <Text style={styles.emptyTitle}>No medicines found</Text>
            <Text style={styles.emptyText}>Try another search or category</Text>
          </View>
        ) : (
          filteredMedicines.map(medicine => {
            const qty = cart[medicine.id] || 0;
            return (
              <View key={medicine.id} style={styles.card}>
                <MedicineThumb image={medicine.image} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {medicine.name}
                    </Text>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>
                        {medicine.category}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.description} numberOfLines={1}>
                    {medicine.description}
                  </Text>

                  <View style={styles.cardBottom}>
                    <Text style={styles.price}>৳{medicine.price}</Text>

                    {qty > 0 ? (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={styles.qtyBtn}
                          onPress={() => removeFromCart(medicine.id)}>
                          <Icon name="remove" size={16} color="#008178" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={styles.qtyBtn}
                          onPress={() => addToCart(medicine)}>
                          <Icon name="add" size={16} color="#008178" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.addBtn}
                        onPress={() => addToCart(medicine)}>
                        <Icon name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {cartCount > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>
              {cartCount} item{cartCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.bottomPrice}>৳{totalPrice}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.checkoutBtn}
            onPress={goToCart}>
            <Text style={styles.checkoutBtnText}>View cart</Text>
            <Icon name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default MedicineScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cartHeaderBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#111820',
    paddingVertical: 0,
  },
  categoryList: {
    flexGrow: 0,
    marginBottom: 14,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#008178',
    borderColor: '#008178',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8190A7',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#8190A7',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  thumbPlaceholder: {
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
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111820',
  },
  categoryTag: {
    backgroundColor: '#E6F4F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#008178',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#008178',
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
    paddingHorizontal: 18,
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
