import { Link, useLocation } from "wouter";
import { 
  CheckSquare, 
  Users, 
  LayoutGrid, 
  PieChart, 
  Settings,
  Menu
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const items = [
  { title: "Check-in", url: "/", icon: CheckSquare },
  { title: "Instrutores", url: "/instructors", icon: Users },
  { title: "Setores", url: "/sectors", icon: LayoutGrid },
  { title: "Relatórios", url: "/reports", icon: PieChart },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/50 shadow-sm">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 text-white font-bold text-xl">
            A
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">Attendance</h2>
            <p className="text-xs text-muted-foreground font-medium">Pro System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link 
                        href={item.url} 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground font-medium'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
