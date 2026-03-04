'use client'

import {
    BarChart3,
    Users,
    Package,
    CreditCard,
    LogOut,
    LayoutDashboard,
} from "lucide-react"
import { NavLink } from "./NavLink"
import { useRouter } from "next/navigation"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    useSidebar,
} from "./ui/sidebar"
import { Button } from "./ui/button"

const items = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Fornecedores", href: "/fornecedores", icon: Users },
    { title: "Contas", href: "/contas", icon: CreditCard },
    { title: "Produtos", href: "/produtos", icon: Package },
]

export function AppSidebar() {
    const { state } = useSidebar()
    const collapsed = state === "collapsed"
    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem("erp_auth")
        router.push("/")
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-sidebar-primary" />
                            {!collapsed && <span className="font-bold text-sm">ERP Pro</span>}
                        </div>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            href={item.href}
                                            exact={item.href === "/dashboard"}
                                            className="hover:bg-sidebar-accent/50"
                                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        >
                                            <item.icon className="mr-2 h-4 w-4" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {!collapsed && "Sair"}
                </Button>
            </SidebarFooter>
        </Sidebar>
    )
}