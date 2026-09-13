import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import Header from '../components/common/Header';
import {paymentService} from '../api/services';
import {useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../api/queryKeys';

const getPaymentData = payload => payload?.data || payload || {};

const BkashCheckout = ({route, navigation}) => {
  const {bookingId} = route.params || {};
  const queryClient = useQueryClient();
  const [currentButtonLoading, setCurrentButtonLoading] = useState(null);
  const [paymentID, setPaymentID] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const webViewRef = useRef(null);
  const startedRef = useRef(false);
  const paymentIDRef = useRef(null);
  const bookingIdRef = useRef(bookingId);
  const executingRef = useRef(false);

  useEffect(() => {
    bookingIdRef.current = bookingId;
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId || startedRef.current) {
      return;
    }
    startedRef.current = true;
    handlePayment();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!bookingId) {
      setStatusMessage('Missing booking information.');
      return;
    }

    try {
      setCurrentButtonLoading(1);
      setStatusMessage('');

      const createPaymentResponse = await paymentService.createBkashPayment(
        bookingId,
      );
      const data = getPaymentData(createPaymentResponse);
      const createdPaymentID = data.paymentID || data.paymentId;

      if (createdPaymentID) {
        paymentIDRef.current = createdPaymentID;
        setPaymentID(createdPaymentID);

        const amount = String(data.amount ?? '');

        const deeplink = `bkash://checkout?paymentID=${createdPaymentID}`;
        const supported = await Linking.canOpenURL(deeplink);

        if (supported) {
          await Linking.openURL(deeplink);
        } else {
          setWebViewUrl(generateBkashHtml(amount, createdPaymentID));
          setShowWebView(true);
        }
      } else {
        setStatusMessage(
          createPaymentResponse?.message ||
            'Payment creation failed. Please try again.',
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatusMessage(error?.message || 'Payment failed. Please try again.');
    } finally {
      setCurrentButtonLoading(null);
    }
  };

  const generateBkashHtml = (amount, paymentIDValue) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://scripts.sandbox.bka.sh/versions/1.2.0-beta/checkout/bKash-checkout-sandbox.js"></script>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3B82F6;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="loader" class="loader"></div>
        <button id="bKash_button" style="display:none;"></button>
        <script>
          function initBkash() {
            bKash.init({
              paymentMode: 'checkout',
              paymentRequest: { 
                amount: '${amount}', 
                intent: 'sale',
                currency: 'BDT'
              },
              createRequest: function(request) {
                bKash.create().onSuccess({ paymentID: '${paymentIDValue}' });
              },
              executeRequestOnAuthorization: function() {
                window.ReactNativeWebView.postMessage('SUCCESS');
              },
              onClose: function() {
                window.ReactNativeWebView.postMessage('CLOSED');
              }
            });
            
            // Trigger the payment UI
            setTimeout(function() {
              document.getElementById('bKash_button').click();
              document.getElementById('loader').style.display = 'none';
            }, 1000);
          }
          
          // Check if bKash is loaded
          if (typeof bKash !== 'undefined') {
            initBkash();
          } else {
            // Poll for bKash script to load
            var checkCount = 0;
            var interval = setInterval(function() {
              if (typeof bKash !== 'undefined') {
                clearInterval(interval);
                initBkash();
              }
              if (checkCount++ > 10) {
                clearInterval(interval);
                window.ReactNativeWebView.postMessage('LOAD_FAILED');
              }
            }, 500);
          }
          
          // Error handling for bKash
          window.addEventListener('error', function(e) {
            window.ReactNativeWebView.postMessage('ERROR: ' + e.message);
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = event => {
    const message = event.nativeEvent.data;

    if (message === 'SUCCESS') {
      executePayment();
    } else if (message === 'CLOSED') {
      setShowWebView(false);
      setStatusMessage('Payment was cancelled.');
    } else if (message === 'LOAD_FAILED') {
      setShowWebView(false);
      setStatusMessage('Failed to load payment system. Please try again.');
    } else if (typeof message === 'string' && message.startsWith('ERROR:')) {
      console.error('WebView Error:', message);
      setShowWebView(false);
      setStatusMessage('An error occurred during payment.');
    }
  };

  const executePayment = async () => {
    if (executingRef.current) {
      return;
    }

    const activePaymentID = paymentIDRef.current || paymentID;
    const activeBookingId = bookingIdRef.current || bookingId;
    if (!activePaymentID || !activeBookingId) {
      setStatusMessage('Payment verification failed. Please contact support.');
      return;
    }

    executingRef.current = true;

    try {
      setCurrentButtonLoading(-1);
      const response = await paymentService.executeBkashPayment(
        activePaymentID,
        activeBookingId,
      );
      const data = getPaymentData(response);

      if (data?.paymentID || data?.paymentId || response?.success) {
        setShowWebView(false);
        setStatusMessage('Payment successful!');
        queryClient.invalidateQueries({queryKey: queryKeys.bookings.lists()});
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.detail(activeBookingId),
        });
        Alert.alert('Success', 'Payment successful!', [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('BookingDetails', {
                bookingId: activeBookingId,
              }),
          },
        ]);
      } else {
        setStatusMessage(
          response?.message ||
            'Payment verification failed. Please contact support.',
        );
      }
    } catch (error) {
      console.error('Execute payment error:', error);
      setShowWebView(false);
      setStatusMessage(
        error?.message ||
          'Payment verification failed. Please contact support.',
      );
    } finally {
      executingRef.current = false;
      setCurrentButtonLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* <Header title="bKash payment" onBack={() => navigation.goBack()} /> */}
      <View style={styles.container}>
        {currentButtonLoading ? (
          <ActivityIndicator size="large" color="#E2136E" />
        ) : null}

        {statusMessage ? (
          <Text style={styles.statusMessage}>{statusMessage}</Text>
        ) : null}

        {!currentButtonLoading &&
        statusMessage &&
        statusMessage !== 'Payment successful!' ? (
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('BookingDetails', {bookingId})
            }>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        ) : null}

        <Modal
          visible={showWebView}
          animationType="slide"
          onRequestClose={() => setShowWebView(false)}
          transparent={false}>
          <SafeAreaView style={styles.safeArea}>

            <WebView
              ref={webViewRef}
              source={{html: webViewUrl}}
              style={styles.webView}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              mixedContentMode="always"
              originWhitelist={['*']}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              thirdPartyCookiesEnabled={true}
              injectedJavaScript={`
                window.addEventListener('error', function(e) {
                  window.ReactNativeWebView.postMessage('ERROR: ' + e.message);
                });
                true;
              `}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    marginTop: 16,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  statusMessage: {
    color: 'red',
    marginTop: 12,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

export default BkashCheckout;
