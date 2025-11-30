'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Package, MapPin, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total_price: number;
  delivery_type: string;
  created_at: string;
  customer_id: string;
  dish_id: string;
  delivery_address_id: string | null;
}

interface Stats {
  totalDeliveries: number;
  activeDeliveries: number;
  totalEarnings: number;
  averageRating: number;
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDeliveries: 0,
    activeDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0
  });
  const [deliveryProfile, setDeliveryProfile] = useState<any>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }
    
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao buscar usuário:', error);
        router.push('/auth?redirect=/delivery/dashboard');
        return;
      }
      
      if (!user) {
        router.push('/auth?redirect=/delivery/dashboard');
        return;
      }

      // Verificar se é entregador
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      }

      if (profile && profile.role !== 'delivery') {
        router.push('/');
        return;
      }

      setDeliveryProfile(profile);
      await loadDashboardData(user.id);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setLoading(false);
    }
  };

  const loadDashboardData = async (userId: string) => {
    try {
      // Carregar pedidos do entregador
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        console.error('Erro ao carregar pedidos:', ordersError);
      }

      // Calcular estatísticas
      const totalDeliveries = ordersData?.filter(o => o.status === 'delivered').length || 0;
      const activeDeliveries = ordersData?.filter(o => ['ready', 'in_delivery'].includes(o.status)).length || 0;
      const totalEarnings = ordersData?.filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total_price * 0.1), 0) || 0; // 10% de comissão

      // Buscar avaliação média
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', userId);

      if (reviewsError) {
        console.error('Erro ao carregar avaliações:', reviewsError);
      }

      const averageRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setOrders(ordersData || []);
      setStats({
        totalDeliveries,
        activeDeliveries,
        totalEarnings,
        averageRating
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      in_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      pending: 'Pendente',
      accepted: 'Aceito',
      preparing: 'Preparando',
      ready: 'Pronto para entrega',
      in_delivery: 'Em entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in_delivery' })
        .eq('id', orderId);

      if (error) throw error;

      // Recarregar dados
      if (deliveryProfile) {
        await loadDashboardData(deliveryProfile.id);
      }
    } catch (error) {
      console.error('Erro ao aceitar entrega:', error);
    }
  };

  const completeDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);

      if (error) throw error;

      // Recarregar dados
      if (deliveryProfile) {
        await loadDashboardData(deliveryProfile.id);
      }
    } catch (error) {
      console.error('Erro ao completar entrega:', error);
    }
  };

  // Tela de configuração necessária
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Configuração Necessária
          </h2>
          <p className="text-gray-600 mb-6">
            Para usar o HomeTaste, você precisa configurar as variáveis de ambiente do Supabase.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-gray-700 mb-2 font-medium">
              Adicione ao arquivo .env.local:
            </p>
            <code className="text-xs text-gray-600 block">
              NEXT_PUBLIC_SUPABASE_URL=sua_url<br/>
              NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
            </code>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard do Entregador</h1>
              <p className="text-sm text-gray-600 mt-1">
                Bem-vindo, {deliveryProfile?.full_name || 'Entregador'}!
              </p>
            </div>
            <button
              onClick={() => router.push('/delivery/available')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
            >
              <MapPin className="w-5 h-5" />
              Entregas Disponíveis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Entregas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Entregas Ativas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeDeliveries}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ganhos Totais</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {stats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avaliação Média</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Entregas Ativas */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Minhas Entregas</h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma entrega no momento</p>
              <button
                onClick={() => router.push('/delivery/available')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver entregas disponíveis
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Pedido #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-500">Cliente ID: {order.customer_id.slice(-8)}</p>
                      <p className="text-sm text-gray-500">Prato ID: {order.dish_id.slice(-8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                      <span className="font-bold text-blue-600">
                        R$ {(Number(order.total_price) * 0.1).toFixed(2)}
                      </span>
                    </div>

                    {order.status === 'ready' && (
                      <button
                        onClick={() => acceptDelivery(order.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Iniciar Entrega
                      </button>
                    )}

                    {order.status === 'in_delivery' && (
                      <button
                        onClick={() => completeDelivery(order.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Marcar como Entregue
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
