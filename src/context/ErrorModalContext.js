import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ErrorModal from '../components/common/ErrorModal';

const ErrorModalContext = createContext({
  showError: () => {},
  hideError: () => {},
});

let externalShowError = null;

/**
 * Show the common error modal from anywhere (screens, services, catch blocks).
 * Usage: showError(error) or showError('message') or showError(error, 'Title')
 */
export const showError = (errorOrMessage, title = 'Error') => {
  const message =
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : errorOrMessage?.message ||
        errorOrMessage?.payload?.message ||
        'Something went wrong. Please try again.';

  if (typeof externalShowError === 'function') {
    externalShowError(message, title);
    return;
  }
  // Provider not mounted yet — no-op; avoid crashing
  console.warn('ErrorModalProvider not ready:', message);
};

export const ErrorModalProvider = ({children}) => {
  const [state, setState] = useState({
    visible: false,
    message: '',
    title: 'Error',
  });

  const hideError = useCallback(() => {
    setState(prev => ({...prev, visible: false}));
  }, []);

  const showErrorLocal = useCallback((message, title = 'Error') => {
    setState({
      visible: true,
      message: String(message || 'Something went wrong. Please try again.'),
      title: title || 'Error',
    });
  }, []);

  useEffect(() => {
    externalShowError = showErrorLocal;
    return () => {
      if (externalShowError === showErrorLocal) {
        externalShowError = null;
      }
    };
  }, [showErrorLocal]);

  const value = useMemo(
    () => ({
      showError: (errorOrMessage, title) => showError(errorOrMessage, title),
      hideError,
    }),
    [hideError],
  );

  return (
    <ErrorModalContext.Provider value={value}>
      {children}
      <ErrorModal
        visible={state.visible}
        message={state.message}
        title={state.title}
        onClose={hideError}
      />
    </ErrorModalContext.Provider>
  );
};

export const useErrorModal = () => useContext(ErrorModalContext);

export default ErrorModalProvider;
