import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AppAlertModal from '../components/common/AppAlertModal';

const AlertModalContext = createContext({
  showAlert: () => {},
  hideAlert: () => {},
});

let externalShowAlert = null;

/**
 * Drop-in replacement for Alert.alert(title, message?, buttons?).
 * Works from screens, services, and context (via module export).
 */
export const showAlert = (title, message = '', buttons) => {
  if (typeof externalShowAlert === 'function') {
    externalShowAlert(title, message, buttons);
    return;
  }
  console.warn('AlertModalProvider not ready:', title, message);
};

export const AlertModalProvider = ({children}) => {
  const [state, setState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const hideAlert = useCallback(() => {
    setState(prev => ({...prev, visible: false}));
  }, []);

  const showAlertLocal = useCallback((title, message = '', buttons) => {
    const resolvedButtons = Array.isArray(buttons)
      ? buttons
      : [{text: 'OK', style: 'default'}];

    setState({
      visible: true,
      title: title != null ? String(title) : '',
      message: message != null ? String(message) : '',
      buttons: resolvedButtons,
    });
  }, []);

  useEffect(() => {
    externalShowAlert = showAlertLocal;
    return () => {
      if (externalShowAlert === showAlertLocal) {
        externalShowAlert = null;
      }
    };
  }, [showAlertLocal]);

  const value = useMemo(
    () => ({
      showAlert,
      hideAlert,
    }),
    [hideAlert],
  );

  return (
    <AlertModalContext.Provider value={value}>
      {children}
      <AppAlertModal
        visible={state.visible}
        title={state.title}
        message={state.message}
        buttons={state.buttons}
        onRequestClose={hideAlert}
      />
    </AlertModalContext.Provider>
  );
};

export const useAlertModal = () => useContext(AlertModalContext);

export default AlertModalProvider;
