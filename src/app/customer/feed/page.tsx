'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Search, MapPin, Clock, Star, Heart, AlertCircle, Filter } from 'lucide-react';

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  category: string;
  available_days: string[];
  available_hours: string;
  accepts_eat_in: boolean;
  is_active: boolean;
  rating: number;
  total_reviews: number;
  cook: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Cook {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export default function CustomerFeed() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }

    loadFeedData();
  }, []);

  useEffect(() => {
    filterDishes();
  }, [dishes, searchTerm, selectedCategory]);

  const loadFeedData = async () => {
    try {
      // Carregar pratos ativos com informações da cozinheira
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select(`
          *,
          cook:profiles!dishes_cook_id_fkey(full_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (dishesError) {
        console.error('Erro ao carregar pratos:', dishesError);
      }

      setDishes(dishesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDishes = () => {
    let filtered = dishes;

    if (searchTerm) {
      filtered = filtered.filter(dish =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.cook.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(dish => dish.category === selectedCategory);
    }

    setFilteredDishes(filtered);
  };

  const getCategories = () => {
    const categories = [...new Set(dishes.map(dish => dish.category))];
    return categories.filter(cat => cat && cat.trim() !== '');
  };

  const handleDishClick = (dishId: string) => {
    router.push(`/customer/dish/${dishId}`);
  };

  const handleCookClick = (cookId: string) => {
    router.push(`/customer/cook/${cookId}`);
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
          <p className="mt-4 text-gray-600">Carregando pratos deliciosos...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Descobrir Pratos</h1>
              <p className="text-sm text-gray-600 mt-1">
                Pratos caseiros feitos com amor pelas cozinheiras da sua região
              </p>
            </div>
            <button
              onClick={() => router.push('/customer/profile')}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Heart className="w-5 h-5" />
              Meus Favoritos
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar pratos ou cozinheiras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:w-48 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                <option value="">Todas as categorias</option>
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredDishes.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum prato encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar seus filtros ou volte mais tarde para ver novos pratos.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => handleDishClick(dish.id)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={dish.photo_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {dish.accepts_eat_in && (
                    <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Eat-in
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={dish.cook.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'}
                      alt={dish.cook.full_name}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCookClick(dish.cook_id);
                      }}
                    />
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-orange-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCookClick(dish.cook_id);
                        }}
                      >
                        {dish.cook.full_name}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {dish.rating.toFixed(1)} ({dish.total_reviews})
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {dish.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {dish.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">
                      R$ {Number(dish.price).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{dish.available_hours}</span>
                    </div>
                  </div>

                  {dish.category && (
                    <div className="mt-2">
                      <span className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                        {dish.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}