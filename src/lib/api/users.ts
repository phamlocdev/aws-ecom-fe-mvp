import { apiClient } from '@/lib/api/api-client'
import type {
  EmailDeliveryStatistics,
  EmailTracking,
  ManagedUser,
  Permission,
  ResendEmailResult,
  UserLoginAuditQueryResult,
  UserProfile,
  UserAddress,
} from '@/lib/types'

export const USER_PROFILE_QUERY_KEYS = {
  all: ['users'] as const,
  me: () => [...USER_PROFILE_QUERY_KEYS.all, 'me'] as const,
  profile: () => [...USER_PROFILE_QUERY_KEYS.me(), 'profile'] as const,
  list: () => [...USER_PROFILE_QUERY_KEYS.all, 'list'] as const,
  emailStatistics: () => [...USER_PROFILE_QUERY_KEYS.all, 'email-statistics'] as const,
  emailTracking: (userId: string) =>
    [...USER_PROFILE_QUERY_KEYS.all, 'email-tracking', userId] as const,
  loginAudit: (filter: string, value: string) =>
    [...USER_PROFILE_QUERY_KEYS.all, 'login-audit', filter, value] as const,
}

export type UpdateUserProfileInput = {
  name?: string
  avatarKey?: string | null
  address?: UserAddress
}

export type SetOwnPasswordInput = {
  password: string
}

export type ResetManagedUserPasswordInput = {
  password: string
}

export type CreateManagedUserInput = {
  username: string
  email: string
  password: string
  name?: string
  group: 'customer' | 'manager' | 'admin'
  permissions?: Permission[]
}

export type UpdateManagedUserInput = {
  email?: string
  name?: string
  enabled?: boolean
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'DELETED'
}

export type UserAccessRecord = {
  userId: string
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export async function getOwnProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>('/users/me/profile')
  return response.data
}

export async function updateOwnProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const response = await apiClient.patch<UserProfile>('/users/me/profile', input)
  return response.data
}

export async function setOwnPassword(input: SetOwnPasswordInput): Promise<void> {
  await apiClient.post('/users/me/password', input)
}

export async function findAllUsers(): Promise<ManagedUser[]> {
  const response = await apiClient.get<ManagedUser[]>('/users')
  return response.data
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<ManagedUser> {
  const response = await apiClient.post<ManagedUser>('/users', input)
  return response.data
}

export async function updateManagedUser(
  userId: string,
  input: UpdateManagedUserInput,
): Promise<ManagedUser> {
  const response = await apiClient.patch<ManagedUser>(`/users/${userId}`, input)
  return response.data
}

export async function updateUserPermissions(
  userId: string,
  permissions: Permission[],
): Promise<UserAccessRecord> {
  const response = await apiClient.patch<UserAccessRecord>(`/users/${userId}/permissions`, {
    permissions,
  })
  return response.data
}

export async function resetManagedUserPassword(
  userId: string,
  input: ResetManagedUserPasswordInput,
): Promise<void> {
  await apiClient.patch(`/users/${userId}/password`, input)
}

export async function disableManagedUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`)
}

export async function getUserEmailStatistics(): Promise<EmailDeliveryStatistics> {
  const response = await apiClient.get<EmailDeliveryStatistics>('/users', {
    params: { emailStatistics: 'true' },
  })
  return response.data
}

export async function getUserEmailTracking(userId: string): Promise<EmailTracking[]> {
  const response = await apiClient.get<EmailTracking[]>(`/users/${userId}/email-tracking`)
  return response.data
}

export async function resendFailedWelcomeEmail(
  userId: string,
  recipientEmail: string,
): Promise<ResendEmailResult> {
  const response = await apiClient.post<ResendEmailResult>(
    `/users/${userId}/emails/welcome-new-customer/resend-failed`,
    { recipientEmail },
  )
  return response.data
}

export async function recordLoginContext(): Promise<void> {
  await apiClient.post('/users/me/login-context')
}

export async function getUserLoginAudit(input: {
  filter: 'userId' | 'username' | 'email'
  value: string
  limit?: number
  cursor?: string
}): Promise<UserLoginAuditQueryResult> {
  const response = await apiClient.get<UserLoginAuditQueryResult>('/users/login-audit', {
    params: {
      [input.filter]: input.value,
      limit: input.limit,
      cursor: input.cursor,
    },
  })
  return response.data
}
