import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Skeleton = ({style}) => (
  <LinearGradient
    colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
    start={{x: 0, y: 0}}
    end={{x: 1, y: 0}}
    style={[styles.skeleton, style]}
  />
);

const NotificationSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={styles.card}>
          <Skeleton style={styles.icon} />
          <View style={styles.content}>
            <Skeleton style={styles.line} />
            <Skeleton style={styles.lineShort} />
            <Skeleton style={styles.time} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  line: {
    width: '95%',
    height: 14,
    borderRadius: 6,
    marginBottom: 8,
  },
  lineShort: {
    width: '70%',
    height: 14,
    borderRadius: 6,
    marginBottom: 10,
  },
  time: {
    width: 60,
    height: 10,
    borderRadius: 4,
  },
});

export default NotificationSkeleton;
