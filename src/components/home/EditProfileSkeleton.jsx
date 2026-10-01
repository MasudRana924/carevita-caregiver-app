import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Skeleton = ({style}) => (
  <LinearGradient
    colors={['#E8ECF1', '#F3F5F8', '#E8ECF1']}
    start={{x: 0, y: 0}}
    end={{x: 1, y: 0}}
    style={[styles.skeleton, style]}
  />
);

const Field = () => (
  <View style={styles.field}>
    <Skeleton style={styles.label} />
    <Skeleton style={styles.input} />
  </View>
);

const EditProfileSkeleton = () => (
  <View style={styles.container}>
    <View style={styles.photoWrap}>
      <Skeleton style={styles.photo} />
      <Skeleton style={styles.hint} />
    </View>

    <Skeleton style={styles.sectionTitle} />
    {[1, 2, 3, 4, 5, 6, 7].map(i => (
      <Field key={`a${i}`} />
    ))}

    <Skeleton style={styles.sectionTitle} />
    {[1, 2, 3].map(i => (
      <Field key={`p${i}`} />
    ))}
  </View>
);

export default EditProfileSkeleton;

const styles = StyleSheet.create({
  container: {paddingHorizontal: 16, paddingBottom: 24},
  skeleton: {backgroundColor: '#E8ECF1'},
  photoWrap: {alignItems: 'center', paddingVertical: 12},
  photo: {width: 88, height: 88, borderRadius: 44},
  hint: {width: 220, height: 12, borderRadius: 6, marginTop: 10},
  sectionTitle: {width: 130, height: 16, borderRadius: 6, marginTop: 14, marginBottom: 14},
  field: {marginBottom: 16},
  label: {width: 90, height: 12, borderRadius: 6, marginBottom: 8},
  input: {height: 54, borderRadius: 27},
});
