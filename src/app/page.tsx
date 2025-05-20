// src/app/page.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  Search,
  Users,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  TrendingUp,
  Handshake,
  ShieldCheck,
  Star,
  BarChart3, // Added for stats
  UserPlus, // Added for stats
  FileText, // Added for stats
  ChevronRight,
  PencilRuler,
  Palette,
  Computer,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { name: "Активных заданий", value: "70+", icon: FileText, color: "text-accent" },
  { name: "Исполнителей онлайн", value: "120+", icon: Users, color: "text-green-400" },
  { name: "Выполненных заказов", value: "300+", icon: CheckCircle, color: "text-blue-400" },
];

const features = [
  {
    icon: Lightbulb,
    title: "Легко найти исполнителя",
    description: "Разместите ваше задание и получайте отклики от заинтересованных специалистов в Ирбите.",
    color: "text-accent"
  },
  {
    icon: Target,
    title: "Работа для каждого",
    description: "Найдите подработку или полноценные проекты в вашем городе по вашей специализации.",
    color: "text-green-400"
  },
  {
    icon: Handshake,
    title: "Прямое взаимодействие",
    description: "Общайтесь с заказчиками и исполнителями напрямую, без посредников и лишних комиссий.",
    color: "text-blue-400"
  },
  {
    icon: ShieldCheck,
    title: "Безопасность и удобство",
    description: "Современный интерфейс и (в будущем) система отзывов для безопасных сделок.",
    color: "text-purple-400"
  },
];

const categories = [
  { name: "Ремонт и стройка", icon: PencilRuler, href: "/tasks?category=Ремонт и строительство" },
  { name: "IT и Дизайн", icon: Palette, href: "/tasks?category=Дизайн и графика" },
  { name: "Компьютерная помощь", icon: Computer, href: "/tasks?category=Компьютерная помощь" },
  { name: "Обучение", icon: GraduationCap, href: "/tasks?category=Репетиторство и обучение" },
];

const howItWorks = [
  {
    step: 1,
    title: "Опубликуйте задание",
    description: "Подробно опишите вашу задачу, чтобы исполнители поняли объем работ.",
    icon: MessageSquare
  },
  {
    step: 2,
    title: "Получите отклики",
    description: "Заинтересованные специалисты из Ирбита предложат свои услуги.",
    icon: Users
  },
  {
    step: 3,
    title: "Выберите исполнителя",
    description: "Ознакомьтесь с предложениями и выберите лучшего кандидата для вашей задачи.",
    icon: CheckCircle
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12 md:space-y-20">
      {/* Hero Section */}
      <section className="text-center py-10 md:py-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Фриланс Ирбит: <span className="text-accent">Найди</span> или <span className="text-accent">Предложи</span> Услугу
        </h1>
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-8">
          Современная площадка для поиска исполнителей и размещения заданий в городе Ирбит. Быстро, удобно, локально.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover-scale text-lg px-8 py-6">
            <Link href="/create-task">
              <Briefcase className="mr-2 h-5 w-5" /> Разместить задание
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="shadow-md hover-scale hover:border-accent hover:text-accent hover:bg-accent/10 text-lg px-8 py-6">
            <Link href="/tasks">
              <Search className="mr-2 h-5 w-5" /> Найти задания
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pb-6 md:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="text-center shadow-md bg-card/70 backdrop-blur-sm p-4 sm:p-6 hover-lift">
                <Icon className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 ${stat.color}`} />
                <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm sm:text-base text-muted-foreground">{stat.name}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Key Features Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Почему выбирают "Фриланс Ирбит"?</h2>
        <p className="text-muted-foreground mb-8 md:mb-12 text-lg">Ключевые преимущества нашей платформы</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="text-left shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    <Icon className={`h-8 w-8 mr-3 ${feature.color}`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Popular Categories Section */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-center mb-2">Популярные категории заданий</h2>
        <p className="text-muted-foreground text-center mb-8 md:mb-12 text-lg">Найдите специалистов или предложите свои услуги</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.name} href={category.href} className="block group">
                <Card className="shadow-md hover:shadow-accent/40 transition-all duration-300 hover-lift bg-card/60 backdrop-blur-sm p-4 text-center aspect-[3/2] sm:aspect-video flex flex-col justify-center items-center">
                  <Icon className="h-8 w-8 sm:h-10 sm:w-10 mb-2 text-accent/80 group-hover:text-accent transition-colors" />
                  <p className="font-semibold text-sm sm:text-md group-hover:text-accent transition-colors">{category.name}</p>
                </Card>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-6 md:mt-8">
          <Button variant="outline" asChild className="hover:border-accent hover:text-accent hover:bg-accent/10 text-md px-6 py-3">
            <Link href="/tasks">Все категории <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Как это работает?</h2>
        <p className="text-muted-foreground mb-8 md:mb-12 text-lg">Всего 3 простых шага</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {howItWorks.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.step} className="shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift bg-card/70 backdrop-blur-sm">
                <CardHeader className="items-center">
                  <div className="bg-accent/20 text-accent p-3 rounded-full mb-3">
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle>Шаг {step.step}: {step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
