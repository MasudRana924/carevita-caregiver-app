import {useCallback, useRef} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {accountService, unwrapData} from '../api/services';
import {queryKeys} from '../api/queryKeys';
import {useAuth} from '../context/AuthContext';
import {toAuthUserPatch} from '../utils/account';

/**
 * Always hits GET /user/me (never cached), stores it under queryKeys.account.me()
 * and mirrors display fields into AuthContext so avatars update app-wide.
 */
export default function useAccountRefresh() {
  const queryClient = useQueryClient();
  const {updateUser} = useAuth();
  const updateUserRef = useRef(updateUser);
  updateUserRef.current = updateUser;

  return useCallback(async () => {
    const response = await queryClient.fetchQuery({
      queryKey: queryKeys.account.me(),
      queryFn: () => accountService.getMe(),
      staleTime: 0,
    });
    const account = unwrapData(response);
    if (account?.id) {
      await updateUserRef.current(toAuthUserPatch(account));
    }
    return account;
  }, [queryClient]);
}
