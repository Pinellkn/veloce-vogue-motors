import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Heart,
  Search,
  MessageSquare,
  History,
  User,
  Car,
  LogOut,
  Bell,
  Shield,
} from "lucide-react";
import { getCurrentUser, logoutUser } from "@/backend/functions/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login", search: { error: undefined } });
    }
    return { user };
  },
  loader: ({ context }) => context.user,
  head: () => ({
    meta: [
      { title: "Tableau de bord — Veloce" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

const navItems: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/favorites", label: "Favoris", icon: Heart },
  { to: "/dashboard/searches", label: "Mes recherches", icon: Search },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/history", label: "Historique", icon: History },
  { to: "/dashboard/profile", label: "Profil", icon: User },
];

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = Route.useLoaderData();
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutUser();
    navigate({ to: "/" });
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "V";

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-hairline bg-white sticky top-0 h-screen">
        <div className="px-6 h-16 flex items-center border-b border-hairline">
          <Link to="/" className="font-serif text-2xl italic">
            Veloce.
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-3 mb-3">
            Espace client
          </p>
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-ink"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          {user.isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-ink transition-colors mt-4 pt-4 border-t border-hairline"
            >
              <Shield className="size-4" />
              Administration
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-hairline">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-medium overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.isPremium ? "Membre Premium" : "Membre"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted"
              title="Déconnexion"
            >
              <LogOut className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-hairline bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Car className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Espace client · <span className="text-ink font-medium">Veloce</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-muted relative">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 bg-destructive rounded-full"></span>
            </button>
            <Link
              to="/"
              className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90"
            >
              Retour au site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
