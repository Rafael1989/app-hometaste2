'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChefHat, ShoppingBag, Truck, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se usuário está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              HomeTaste
            </h1>
          </div>
          {user ? (
            <Button
              variant="outline"
              onClick={() => supabase.auth.signOut()}
            >
              Sair
            </Button>
          ) : (
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Comida caseira feita com amor
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Conectamos você com cozinheiras talentosas da sua região. 
          Sabor autêntico, entrega rápida e a possibilidade de comer na casa da cozinheira!
        </p>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Cozinheira */}
          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-orange-500">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Sou Cozinheira</CardTitle>
              <CardDescription className="text-base">
                Venda seus pratos caseiros e ganhe dinheiro fazendo o que ama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
                <li>✓ Cadastre seus pratos</li>
                <li>✓ Defina preços e horários</li>
                <li>✓ Receba em casa ou entregue</li>
                <li>✓ Ganhe pontos e badges</li>
              </ul>
              <Link href={user ? '/cook/dashboard' : '/auth?role=cook'}>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  Começar a Vender
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-green-500">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Sou Cliente</CardTitle>
              <CardDescription className="text-base">
                Descubra pratos deliciosos feitos por cozinheiras da sua região
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
                <li>✓ Explore pratos locais</li>
                <li>✓ Delivery ou coma na casa</li>
                <li>✓ Avalie e favorite</li>
                <li>✓ Endereços salvos</li>
              </ul>
              <Link href={user ? '/customer/feed' : '/auth?role=customer'}>
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  Explorar Pratos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Entregador */}
          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-500">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Sou Entregador</CardTitle>
              <CardDescription className="text-base">
                Faça entregas na sua região e ganhe dinheiro extra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
                <li>✓ Escolha suas entregas</li>
                <li>✓ Rotas otimizadas</li>
                <li>✓ Histórico de ganhos</li>
                <li>✓ Sistema de pontos</li>
              </ul>
              <Link href={user ? '/delivery/dashboard' : '/auth?role=delivery'}>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                  Começar a Entregar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Por que escolher o HomeTaste?</h3>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h4 className="font-semibold mb-2">Comida Caseira</h4>
              <p className="text-sm text-gray-600">Pratos feitos com carinho e ingredientes frescos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h4 className="font-semibold mb-2">Perto de Você</h4>
              <p className="text-sm text-gray-600">Cozinheiras da sua região para entrega rápida</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h4 className="font-semibold mb-2">Avaliações</h4>
              <p className="text-sm text-gray-600">Sistema de reviews para garantir qualidade</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎮</span>
              </div>
              <h4 className="font-semibold mb-2">Gamificação</h4>
              <p className="text-sm text-gray-600">Ganhe pontos, badges e recompensas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-bold">HomeTaste</span>
          </div>
          <p className="text-gray-400 text-sm">
            Conectando pessoas através da comida caseira © 2024
          </p>
        </div>
      </footer>
    </div>
  )
}
