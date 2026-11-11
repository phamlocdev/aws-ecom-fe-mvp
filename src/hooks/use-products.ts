import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  PRODUCT_QUERY_KEYS,
  createProduct,
  deleteProduct,
  findAllProducts,
  findProductById,
  updateProduct,
  type FindAllProductsQueryParams,
} from '@/lib/api/products'
import { INVENTORY_QUERY_KEYS } from '@/lib/api/inventories'
import type { ProductFormValues } from '@/lib/schemas'

export function useProductsQuery(
  params?: FindAllProductsQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery(PRODUCT_QUERY_KEYS.list(params), () => findAllProducts(params), {
    enabled: options?.enabled ?? true,
    keepPreviousData: true,
  })
}

export function useProductQuery(productId: string, options?: { enabled?: boolean }) {
  return useQuery(PRODUCT_QUERY_KEYS.detail(productId), () => findProductById(productId), {
    enabled: Boolean(productId) && (options?.enabled ?? true),
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: ProductFormValues) => createProduct(input), {
    onSuccess: () => {
      void queryClient.invalidateQueries(PRODUCT_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(INVENTORY_QUERY_KEYS.lists())
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ productId, input }: { productId: string; input: ProductFormValues }) =>
      updateProduct(productId, input),
    {
      onSuccess: (product) => {
        void queryClient.invalidateQueries(PRODUCT_QUERY_KEYS.lists())
        void queryClient.invalidateQueries(PRODUCT_QUERY_KEYS.detail(product.id))
        void queryClient.invalidateQueries(INVENTORY_QUERY_KEYS.lists())
      },
    },
  )
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation((productId: string) => deleteProduct(productId), {
    onSuccess: () => {
      void queryClient.invalidateQueries(PRODUCT_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(INVENTORY_QUERY_KEYS.lists())
    },
  })
}
