import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import {useCaregiverReviews} from '../api/queries';
import {unwrapList} from '../api/envelope';

const formatDate = value => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ReviewsScreen = ({navigation}) => {
  const {data, isLoading} = useCaregiverReviews({page: 1, limit: 50});
  const reviews = unwrapList(data);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Reviews" onBack={() => navigation?.goBack()} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <Text style={styles.emptyText}>Loading reviews...</Text>
        ) : reviews.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="star-outline" size={40} color="#008178" />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>
              Ratings and comments from families will appear here.
            </Text>
          </View>
        ) : (
          reviews.map((item, index) => {
            const rating = Number(item.rating || item.stars || 0);
            const comment = item.comment || item.review || item.body || '';
            return (
              <View key={item.id || index} style={styles.card}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Icon
                      key={star}
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={16}
                      color="#F5B400"
                    />
                  ))}
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
                {!!comment && <Text style={styles.comment}>{comment}</Text>}
                {!!item.booking_number && (
                  <Text style={styles.meta}>Booking {item.booking_number}</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewsScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  content: {paddingHorizontal: 16, paddingBottom: 28},
  empty: {alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24},
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
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  starRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  date: {marginLeft: 8, fontSize: 12, color: '#8190A7'},
  comment: {marginTop: 10, fontSize: 14, lineHeight: 20, color: '#111820'},
  meta: {marginTop: 8, fontSize: 12, color: '#8190A7'},
});
