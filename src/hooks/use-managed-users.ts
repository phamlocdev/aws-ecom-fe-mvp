import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  USER_PROFILE_QUERY_KEYS,
  createManagedUser,
  disableManagedUser,
  findAllUsers,
  getUserEmailStatistics,
  getUserLoginAudit,
  recordLoginContext,
  resendFailedWelcomeEmail,
  resetManagedUserPassword,
  updateUserPermissions,
  type CreateManagedUserInput,
  type ResetManagedUserPasswordInput,
} from '@/lib/api/users'
import type { Permission } from '@/lib/types'

export function useUsersQuery() {
  return useQuery(USER_PROFILE_QUERY_KEYS.list(), findAllUsers)
}

export function useCreateManagedUserMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: CreateManagedUserInput) => createManagedUser(input), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
    },
  })
}

export function useUpdateUserPermissionsMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ userId, permissions }: { userId: string; permissions: Permission[] }) =>
      updateUserPermissions(userId, permissions),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
      },
    },
  )
}

export function useDisableManagedUserMutation() {
  const queryClient = useQueryClient()

  return useMutation((userId: string) => disableManagedUser(userId), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
    },
  })
}

export function useResetManagedUserPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ userId, input }: { userId: string; input: ResetManagedUserPasswordInput }) =>
      resetManagedUserPassword(userId, input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list())
      },
    },
  )
}

export function useUserEmailStatisticsQuery() {
  return useQuery(USER_PROFILE_QUERY_KEYS.emailStatistics(), getUserEmailStatistics)
}

export function useResendFailedWelcomeEmailMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ userId, recipientEmail }: { userId: string; recipientEmail: string }) =>
      resendFailedWelcomeEmail(userId, recipientEmail),
    {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.list()),
          queryClient.invalidateQueries(USER_PROFILE_QUERY_KEYS.emailStatistics()),
        ])
      },
    },
  )
}

export function useRecordLoginContextMutation() {
  return useMutation(() => recordLoginContext())
}

export function useUserLoginAuditQuery(input: {
  filter: 'userId' | 'username' | 'email'
  value: string
  limit?: number
  enabled?: boolean
}) {
  return useQuery(
    USER_PROFILE_QUERY_KEYS.loginAudit(input.filter, input.value),
    () => getUserLoginAudit(input),
    {
      enabled: input.enabled ?? Boolean(input.value),
    },
  )
}
