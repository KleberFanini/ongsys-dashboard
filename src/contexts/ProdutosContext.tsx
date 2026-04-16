import { createDataContext } from '@/src/lib/api/createDataContext'
import { Produto } from '@/src/types/produto'

export const { Provider: ProdutosProvider, useData: useProdutos } =
    createDataContext<Produto>({ cacheKey: 'produtos_cache', endpoint: 'produtos' })