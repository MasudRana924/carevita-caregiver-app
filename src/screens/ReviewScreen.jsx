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
import Header from '../components/common/Header';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import {apiRequest} from '../services/api';
import {showError} from '../context/ErrorModalContext';

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
      showError('Please select a rating');
      return;
    }

    if (!review.trim()) {
      showError('Please write a review');
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
        showError(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      showError('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Write a Review"
        onBack={() => navigation.goBack()}
      />

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
          <AppInput
            label="Your review"
            value={review}
            onChangeText={setReview}
            placeholder="Share your experience with the caregiver..."
            multiline
            numberOfLines={6}
          />
        </View>

        <AppButton
          title={loading ? undefined : 'Submit Review'}
          onPress={submitReview}
          disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
        </AppButton>
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
});

export default ReviewScreen;
