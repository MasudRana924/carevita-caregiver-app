import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import AppButton from '../components/common/AppButton';
import {usePrivacyPolicy} from '../api/queries';
import {FORM} from '../components/common/formStyles';

const looksLikeHtml = value =>
  typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value.trim());

const pickPolicyFields = payload => {
  const data = payload?.data;
  if (!data) {
    return {title: 'Privacy and Policy', content: ''};
  }
  if (typeof data === 'string') {
    return {title: 'Privacy and Policy', content: data};
  }

  const item = Array.isArray(data) ? data[0] || {} : data;
  const content =
    item.content ||
    item.body ||
    item.html ||
    item.policy ||
    item.policy_text ||
    item.text ||
    item.description ||
    '';
  const title =
    item.title ||
    item.name ||
    item.heading ||
    'Privacy and Policy';

  return {title, content: String(content || '')};
};

const PrivacyPolicyScreen = ({navigation, route}) => {
  const role = route?.params?.role || 'CAREGIVER';
  const {height} = useWindowDimensions();
  const {data, isLoading, isError, error, refetch, isRefetching} =
    usePrivacyPolicy(role);

  const {content} = useMemo(() => pickPolicyFields(data), [data]);
  const isHtml = looksLikeHtml(content);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Header
        title="Privacy and Policy"
        onBack={() => navigation?.goBack()}
      />
      <Loader visible={isLoading} overlay />

      {isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error?.message || 'Failed to load privacy policy'}
          </Text>
          <AppButton title="Retry" onPress={() => refetch()} style={styles.retry} />
        </View>
      ) : isLoading ? null : isHtml ? (
        <WebView
          originWhitelist={['*']}
          source={{
            html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:16px;color:#0E2A24;font-size:15px;line-height:1.55;margin:0}h1,h2,h3{color:#0B5F4E}</style></head><body>${content}</body></html>`,
          }}
          style={{flex: 1, minHeight: height * 0.7}}
          startInLoadingState
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }>
          <Text style={styles.body}>
            {content || 'No privacy policy content available.'}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#FFFFFF'},
  scroll: {flex: 1},
  content: {paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32},
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: FORM.title,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: FORM.muted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: FORM.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  retry: {alignSelf: 'stretch', maxWidth: 220},
});
