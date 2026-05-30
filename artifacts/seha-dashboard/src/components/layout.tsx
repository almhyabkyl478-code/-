import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { LayoutDashboard, FileText, Search, PlusCircle, Activity } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "لوحة القيادة (Dashboard)", icon: LayoutDashboard },
    { href: "/leaves", label: "سجل الإجازات (Leaves)", icon: FileText },
    { href: "/leaves/new", label: "إصدار إجازة (New Leave)", icon: PlusCircle },
    { href: "/inquiry", label: "استعلام عام (Public Inquiry)", icon: Search },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-muted/40 font-sans flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-l border-sidebar-border text-sidebar-foreground flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-accent/50 gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-lg tracking-tight">منصة صحة | Seha</h1>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}>
                <item.icon className="w-5 h-5 opacity-80" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50 text-center">
          وزارة الصحة - المملكة العربية السعودية
          <br />
          Ministry of Health - KSA
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-card border-b flex items-center justify-between px-6 shrink-0">
          <h2 className="font-semibold text-lg">بوابة إدارة الإجازات المرضية</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>المستخدم: مدير النظام (Admin)</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">م</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
