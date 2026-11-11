import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  CATEGORY_QUERY_KEYS,
  createCategory,
  deleteCategory,
  findAllCategories,
  findCategoryById,
  updateCategory,
  type FindAllCategoriesQueryParams,
} from '@/lib/api/categories'
import type { CategoryCreateValues, CategoryUpdateValues } from '@/lib/schemas'

export function useCategoriesQuery(
  params?: FindAllCategoriesQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery(CATEGORY_QUERY_KEYS.list(params), () => findAllCategories(params), {
    enabled: options?.enabled ?? true,
    keepPreviousData: true,
  })
}

export function useCategoryQuery(categoryId: string, options?: { enabled?: boolean }) {
  return useQuery(CATEGORY_QUERY_KEYS.detail(categoryId), () => findCategoryById(categoryId), {
    enabled: Boolean(categoryId) && (options?.enabled ?? true),
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: CategoryCreateValues) => createCategory(input), {
    onSuccess: () => {
      void queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.lists())
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ categoryId, input }: { categoryId: string; input: CategoryUpdateValues }) =>
      updateCategory(categoryId, input),
    {
      onSuccess: (category) => {
        void queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.lists())
        void queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.detail(category.id))
      },
    },
  )
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation((categoryId: string) => deleteCategory(categoryId), {
    onSuccess: () => {
      void queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.lists())
    },
  })
}
