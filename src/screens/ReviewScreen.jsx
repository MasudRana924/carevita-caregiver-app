import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiRequest} from '../services/api';

const ReviewScreen = ({route, navigation}) => {
  const {bookingId} = route.params || {};
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRating = value => {
    setRating(value);
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!review.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/reviews', 'POST', {
        booking_id: bookingId,
        rating: rating,
        review: review.trim(),
      });

      if (response.success) {
        Alert.alert('Success', 'Thank you for your review!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingDetails', {bookingId}),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#111820" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>Rate your experience</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRating(star)}
                style={styles.starButton}>
                <Icon
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? '#FFD700' : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Your review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience with the caregiver..."
            placeholderTextColor="#8190A7"
            multiline
            numberOfLines={6}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitReview}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
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
  ratingContainer: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  reviewContainer: {
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 12,
  },
  reviewInput: {
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#111820',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#008178',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#8190A7',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReviewScreen;
