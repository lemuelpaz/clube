import Link from 'next/link'
import { Shield, Star, Heart, Crown, CheckCircle, ChevronRight, Lock, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-gold-500/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="text-gold-500" size={24} />
            <span className="text-xl font-bold text-gradient-gold">Clube Elite</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-dark-200 text-sm">
            <a href="#como-funciona" className="hover:text-gold-400 transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-gold-400 transition-colors">Planos</a>
            <a href="#seguranca" className="hover:text-gold-400 transition-colors">Segurança</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-dark-200 hover:text-dark-50 transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link href="/register" className="bg-gold-500 hover:bg-gold-400 text-dark-50 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
              Cadastrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-600/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 border border-gold-500/20">
            <Shield size={14} className="text-gold-400" />
            <span className="text-xs text-gold-400 font-medium">100% Verificado e Seguro</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Conexões{' '}
            <span className="text-gradient-gold">Exclusivas</span>
            <br />para Pessoas Especiais
          </h1>
          <p className="text-lg md:text-xl text-dark-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            A plataforma premium que conecta homens de alto padrão com mulheres verificadas.
            Segurança, autenticidade e experiência de elite em cada interação.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="group w-full sm:w-auto bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-8 py-4 rounded-full text-base transition-all flex items-center justify-center gap-2 gold-glow">
              Começar Agora
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto border border-gold-500/30 hover:border-gold-500/60 text-dark-50 px-8 py-4 rounded-full text-base transition-all text-center">
              Já tenho conta
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-dark-300">
            <div className="flex items-center gap-2"><CheckCircle size={14} className="text-gold-500" /><span>+5.000 perfis verificados</span></div>
            <div className="flex items-center gap-2"><CheckCircle size={14} className="text-gold-500" /><span>Privacidade garantida</span></div>
            <div className="flex items-center gap-2"><CheckCircle size={14} className="text-gold-500" /><span>Suporte premium</span></div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
            <p className="text-dark-200 max-w-xl mx-auto">Em apenas três passos simples você começa a fazer conexões exclusivas</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Crown, step: '01', title: 'Crie seu Perfil', desc: 'Cadastre-se e configure um perfil completo com suas fotos e interesses.', color: 'text-gold-400' },
              { icon: Shield, step: '02', title: 'Verificação Segura', desc: 'Para mulheres: verificação de identidade obrigatória garantindo autenticidade total.', color: 'text-gold-400' },
              { icon: Heart, step: '03', title: 'Faça Conexões', desc: 'Descubra perfis, dê likes, faça matches e converse com quem te interessar.', color: 'text-gold-400' },
            ].map(({ icon: Icon, step, title, desc, color }) => (
              <div key={step} className="relative p-8 rounded-2xl bg-dark-800 border border-dark-500 card-hover">
                <div className="text-5xl font-black text-dark-600 mb-4">{step}</div>
                <Icon className={`${color} mb-4`} size={32} />
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-dark-200 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-dark-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos <span className="text-gradient-gold">Premium</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Verificação de Identidade', desc: 'Todas as mulheres passam por verificação rigorosa de documentos e selfie.' },
              { icon: Heart, title: 'Sistema de Match', desc: 'Match automático quando há interesse mútuo entre dois perfis.' },
              { icon: Zap, title: 'Chat em Tempo Real', desc: 'Mensagens instantâneas com indicadores de leitura e compartilhamento de fotos.' },
              { icon: Star, title: 'Destaque de Perfil', desc: 'Apareça em primeiro nas buscas e atraia mais conexões qualificadas.' },
              { icon: Lock, title: 'Privacidade Total', desc: 'Controle total sobre quem vê seu perfil. Bloqueio e denúncia com um clique.' },
              { icon: Crown, title: 'Experiência Elite', desc: 'Interface premium com curadoria de perfis alinhados ao seu estilo.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl bg-dark-800 border border-dark-500 hover:border-gold-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4">
                  <Icon className="text-gold-400" size={22} />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-dark-200 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos de Assinatura</h2>
            <p className="text-dark-200">Escolha o plano ideal para você</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: 'Mensal', price: 'R$ 149,90', period: '/mês', popular: false },
              { name: 'Trimestral', price: 'R$ 399,90', period: '/3 meses', popular: false },
              { name: 'Semestral', price: 'R$ 699,90', period: '/6 meses', popular: true },
              { name: 'Anual', price: 'R$ 1.199,90', period: '/ano', popular: false },
            ].map(({ name, price, period, popular }) => (
              <div key={name} className={`relative p-6 rounded-2xl border transition-all card-hover ${popular ? 'bg-gold-500/10 border-gold-500 gold-glow' : 'bg-dark-800 border-dark-500'}`}>
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-dark-50 text-xs font-bold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-2xl font-black text-gradient-gold">{price}</span>
                  <span className="text-dark-300 text-sm">{period}</span>
                </div>
                {['Acesso a todos os perfis', 'Mensagens ilimitadas', 'Filtros avançados', 'Ver quem visitou', 'Suporte prioritário'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-dark-100 mb-2">
                    <CheckCircle size={14} className="text-gold-400 shrink-0" />
                    {f}
                  </div>
                ))}
                <Link href="/register" className={`mt-6 block text-center py-3 rounded-full text-sm font-bold transition-all ${popular ? 'bg-gold-500 text-dark-50 hover:bg-gold-400' : 'border border-gold-500/40 text-gold-400 hover:border-gold-500'}`}>
                  Assinar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segurança */}
      <section id="seguranca" className="py-24 px-6 bg-dark-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="text-gold-400 mx-auto mb-6" size={48} />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Segurança é Nossa Prioridade</h2>
          <p className="text-dark-200 text-lg mb-12 leading-relaxed">
            Todas as mulheres passam por um processo rigoroso de verificação de identidade antes de acessar a plataforma.
            Documentos, selfies e revisão administrativa garantem que cada perfil é de uma pessoa real.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Documento Oficial', desc: 'Upload de RG, CNH ou passaporte válido' },
              { step: '2', title: 'Selfie Verificada', desc: 'Selfie segurando o documento em tempo real' },
              { step: '3', title: 'Revisão Humana', desc: 'Nossa equipe analisa e aprova cada perfil' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="p-6 rounded-xl bg-dark-800 border border-dark-500">
                <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold mb-4 mx-auto">
                  {step}
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-dark-200">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Conhecer Pessoas <span className="text-gradient-gold">Especiais</span>?
          </h2>
          <p className="text-dark-200 mb-8">Cadastre-se gratuitamente e comece sua jornada de conexões exclusivas.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-10 py-4 rounded-full text-base transition-all gold-glow">
            Criar Conta Gratuita
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-dark-300">
          <div className="flex items-center gap-2">
            <Crown className="text-gold-500" size={18} />
            <span className="font-bold text-dark-50">Clube Elite</span>
          </div>
          <p>© 2024 Clube Elite. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold-400 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Termos</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

