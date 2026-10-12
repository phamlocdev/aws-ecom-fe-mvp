import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  USER_PROFILE_QUERY_KEYS,
  getOwnProfile,
  setOwnPassword,
  updateOwnProfile,
  type SetOwnPasswordInput,
  type UpdateUserProfileInput,
} from '@/lib/api/users'

export function useUserProfileQuery(options?: { enabled?: boolean }) {
  return useQuery(USER_PROFILE_QUERY_KEYS.profile(), getOwnProfile, {
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: UpdateUserProfileInput) => updateOwnProfile(input), {
    onSuccess: () => {
      void queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.profile())
    },
  })
}

export function useSetOwnPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: SetOwnPasswordInput) => setOwnPassword(input), {
    onSuccess: () => {
      void queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.profile())
    },
  })
}
