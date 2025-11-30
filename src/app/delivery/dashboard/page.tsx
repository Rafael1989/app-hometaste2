'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Car, MapPin, Star, CheckCircle, Clock, Box } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  role: string
  avatar_url?: string
}

interface Order {
  id: string
  status: string
  total_price: number
  created_at: string
  customer?: { full_name: string }
  dish?: { name: string }
  delivery_address?: {
    street: string
    number: string
    neighborhood: string
    city: string
  }
}

const DeliveryDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Verificar se é delivery
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'delivery') {
        router.push('/')
        return
      }

      setProfile(profileData)

      // Carregar pedidos para entrega
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!orders_customer_id_fkey(full_name),
          dish:dishes(name),
          delivery_address:addresses(street, number, neighborhood, city)
        `)
        .eq('delivery_id', user.id)
        .in('status', ['ready', 'in_delivery'])
        .order('created_at', { ascending: false })

      setOrders(ordersData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      loadData() // recarregar
    } catch (err) {
      alert('Erro ao atualizar status')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Erro: {error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Car className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Entregador</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {profile?.full_name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Box className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pedidos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aguardando Coleta</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'ready').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Entrega</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'in_delivery').length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pedidos para Entrega</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {orders.map(order => (
              <div key={order.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Box className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{order.dish?.name}</h3>
                        <p className="text-sm text-gray-500">Cliente: {order.customer?.full_name}</p>
                        <p className="text-sm text-gray-500">
                          <MapPin className="inline h-4 w-4 mr-1" />
                          {order.delivery_address?.street}, {order.delivery_address?.number} - {order.delivery_address?.neighborhood}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'in_delivery' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'ready' ? 'Pronto para coleta' :
                       order.status === 'in_delivery' ? 'Em entrega' : order.status}
                    </span>
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'in_delivery')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        Iniciar Entrega
                      </button>
                    )}
                    {order.status === 'in_delivery' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        Marcar como Entregue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Nenhum pedido para entrega no momento.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DeliveryDashboard