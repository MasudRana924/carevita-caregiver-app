import React from 'react';
import {View, StyleSheet} from 'react-native';

const Bone = ({style}) => <View style={[styles.bone, style]} />;

const WalletSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Bone style={styles.balanceLabel} />
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
    backgroundColor: '#E8EEF2',
    borderRadius: 8,
  },
  balanceCard: {
    backgroundColor: '#F0FAF8',
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
  },
  balanceLabel: {width: 120, height: 14},
  balanceValue: {marginTop: 12, width: 160, height: 32, borderRadius: 10},
  currency: {marginTop: 10, width: 48, height: 12},
  withdrawBtn: {
    marginTop: 18,
    width: 120,
    height: 40,
    borderRadius: 999,
  },
  sectionTitle: {width: 110, height: 16, marginBottom: 14},
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  txIcon: {width: 40, height: 40, borderRadius: 12, marginRight: 12},
  txInfo: {flex: 1},
  txTitle: {width: '70%', height: 14},
  txMeta: {marginTop: 8, width: '50%', height: 11},
  txAmount: {width: 56, height: 14},
});
