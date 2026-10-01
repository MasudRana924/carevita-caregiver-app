import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_OFFSET = 16;

/**
 * Bottom padding a tab screen's scroll content needs so its last item can
 * scroll above the absolutely positioned floating tab bar.
 */
export default function useTabBarSpace(extra = 16) {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_OFFSET + TAB_BAR_HEIGHT + extra;
}
