let onSessionExpired = null;
let expiring = false;

export const setSessionExpiredHandler = handler => {
  onSessionExpired = handler;
};

export const expireSession = async () => {
  if (expiring) {
    return;
  }
  expiring = true;
  try {
    if (typeof onSessionExpired === 'function') {
      await onSessionExpired();
    }
  } finally {
    expiring = false;
  }
};
