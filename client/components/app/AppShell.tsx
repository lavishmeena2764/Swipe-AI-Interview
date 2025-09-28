import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Moon, SunMedium, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, uiActions } from "@/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const theme = useSelector((s: RootState) => s.ui.theme);
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return (
    <SidebarProvider>
      <Sidebar className="bg-sidebar">
        <SidebarHeader className="px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <div className="h-10 w-10 px-1 rounded-full bg-white grid place-items-center">
              <img src="/logo.png" alt="Swipe Logo" />
            </div>
            <span className="text-foreground">Swipe Interview</span>
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Views</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink
                    to="/"
                    className={({ isActive }) => cn("block", isActive && "")}
                  >
                    <SidebarMenuButton
                      isActive={location.pathname.startsWith("/")}
                    >
                      <span>Interviewer (Dashboard)</span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
                                <SidebarMenuItem>
                  <NavLink
                    to="/interview"
                    end
                    className={({ isActive }) => cn("block", isActive && "")}
                  >
                    <SidebarMenuButton isActive={location.pathname === "/interview"}>
                      <span>Interviewee (Chat)</span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4 h-14">
            <SidebarTrigger />
            
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Toggle theme"
                onClick={() =>
                  dispatch(
                    uiActions.setTheme(theme === "dark" ? "light" : "dark"),
                  )
                }
              >
                {theme === "dark" ? (
                  <SunMedium className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
              <Avatar>
                <AvatarFallback>LM</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
