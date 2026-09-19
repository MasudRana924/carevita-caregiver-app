import React from 'react';
import {View, StyleSheet} from 'react-native';

const Bone = ({style}) => <View style={[styles.bone, style]} />;

const WalletSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Bone style={styles.topRow} />
        <Bone style={styles.balanceValue} />
        <Bone style={styles.currency} />
        <Bone style={styles.withdrawBtn} />
      </View>

      <Bone style={styles.sectionTitle} />
      {[1, 2, 3].map(i => (
        <View key={`tx-${i}`} style={styles.txCard}>
          <Bone style={styles.txIcon} />
          <View style={styles.txInfo}>
            <Bone style={styles.txTitle} />
            <Bone style={styles.txMeta} />
          </View>
          <Bone style={styles.txAmount} />
        </View>
      ))}
    </View>
  );
};

export default WalletSkeleton;

const styles = StyleSheet.create({
  container: {paddingHorizontal: 16, paddingBottom: 28},
  bone: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8,
  },
  balanceCard: {
    backgroundColor: '#067A6E',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 54,
    marginBottom: 22,
    minHeight: 168,
    overflow: 'hidden',
  },
  topRow: {width: 150, height: 14},
  balanceValue: {marginTop: 16, width: 140, height: 34, borderRadius: 10},
  currency: {marginTop: 10, width: 40, height: 12},
  withdrawBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 130,
    height: 42,
    borderTopLeftRadius: 999,
    borderBottomRightRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  sectionTitle: {
    width: 110,
    height: 16,
    marginBottom: 14,
    backgroundColor: '#E8EEF2',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E8EEF2',
  },
  txInfo: {flex: 1},
  txTitle: {width: '70%', height: 14, backgroundColor: '#E8EEF2'},
  txMeta: {marginTop: 8, width: '50%', height: 11, backgroundColor: '#E8EEF2'},
  txAmount: {width: 56, height: 14, backgroundColor: '#E8EEF2'},
});
