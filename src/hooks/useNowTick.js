import {useEffect, useState} from 'react';
import {AppState} from 'react-native';

/**
 * 1s tick while mounted; resyncs when app returns to foreground.
 */
const useNowTick = (enabled = true) => {
  const [nowTs, setNowTs] = useState(Date.now);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const tick = () => setNowTs(Date.now());
    const interval = setInterval(tick, 1000);
    const appSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        tick();
      }
    });
    return () => {
      clearInterval(interval);
      appSub.remove();
    };
  }, [enabled]);

  return nowTs;
};

export default useNowTick;
