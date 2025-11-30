'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Plus, Package, Star, TrendingUp, Clock, DollarSign, AlertCircle } from 'lucide-react';

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  is_active: boolean;
  accepts_eat_in: boolean;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  customer_id: string;
}

interface Stats {
  totalDishes: number;
  activeOrders: number;
  totalEarnings: number;
  averageRating: number;
}

export default function CookDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDishes: 0,
    activeOrders: 0,
    totalEarnings: 0,
    averageRating: 0
  });
  const [cookProfile, setCookProfile] = useState<any>(null);
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
        router.push('/auth?redirect=/cook/dashboard');
        return;
      }
      
      if (!user) {
        router.push('/auth?redirect=/cook/dashboard');
        return;
      }

      // Verificar se é cozinheira
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        // Continuar mesmo com erro - pode ser que a tabela não exista ainda
      }

      if (profile && profile.role !== 'cook') {
        router.push('/');
        return;
      }

      setCookProfile(profile);
      await loadDashboardData(user.id);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setLoading(false);
    }
  };

  const loadDashboardData = async (userId: string) => {
    try {
      // Carregar pratos - SEM relacionamento
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .eq('cook_id', userId)
        .order('created_at', { ascending: false });

      if (dishesError) {
        console.error('Erro ao carregar pratos:', dishesError);
      }

      // Carregar pedidos recentes - SEM relacionamento
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('cook_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) {
        console.error('Erro ao carregar pedidos:', ordersError);
      }

      // Calcular estatísticas
      const totalDishes = dishesData?.length || 0;
      const activeOrders = ordersData?.filter(o => ['pending', 'preparing'].includes(o.status)).length || 0;
      const totalEarnings = ordersData?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

      // Buscar avaliação média (reviewed_id é o ID da cozinheira)
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

      setDishes(dishesData || []);
      setOrders(ordersData || []);
      setStats({
        totalDishes,
        activeOrders,
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
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivering: 'bg-purple-100 text-purple-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      pending: 'Pendente',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivering: 'Em entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
  };

  // Tela de configuração necessária
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
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
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard da Cozinheira</h1>
              <p className="text-sm text-gray-600 mt-1">
                Bem-vinda, {cookProfile?.full_name || 'Cozinheira'}!
              </p>
            </div>
            <button
              onClick={() => router.push('/cook/dishes/new')}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Novo Prato
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
                <p className="text-sm text-gray-600 mb-1">Total de Pratos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDishes}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pedidos Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
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
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Meus Pratos */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Meus Pratos</h2>
              <button
                onClick={() => router.push('/cook/dishes')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Ver todos
              </button>
            </div>

            {dishes.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhum prato cadastrado ainda</p>
                <button
                  onClick={() => router.push('/cook/dishes/new')}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Cadastrar primeiro prato
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {dishes.slice(0, 3).map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/cook/dishes/${dish.id}`)}
                  >
                    <img
                      src={dish.photo_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'}
                      alt={dish.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{dish.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-orange-600">
                          R$ {Number(dish.price).toFixed(2)}
                        </span>
                        {dish.accepts_eat_in && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Eat-in
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      dish.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {dish.is_active ? 'Disponível' : 'Indisponível'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pedidos Recentes */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Pedidos Recentes</h2>
              <button
                onClick={() => router.push('/cook/orders')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Ver todos
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum pedido ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/cook/orders/${order.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        Pedido #{order.id.slice(-8)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="font-bold text-orange-600">
                        R$ {Number(order.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
