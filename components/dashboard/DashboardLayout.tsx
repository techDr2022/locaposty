"use client";
import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  Home,
  Calendar,
  MessageSquare,
  LayoutDashboard,
  Menu,
  X,
  BarChart3,
  Settings,
  Bell,
  Plus,
  User,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [selectedLocation, setSelectedLocation] = useState("San Francisco, CA");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Posts", icon: Calendar, path: "/posts" },
    { name: "Reviews", icon: MessageSquare, path: "/reviews" },
    { name: "Reports", icon: BarChart3, path: "/reports" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link
              href="/"
              className="font-semibold text-xl text-locaposty-primary flex items-center"
            >
              <span className="text-locaposty-secondary">Loca</span>Posty
            </Link>

            {!isMobile && (
              <nav className="ml-8 hidden md:flex">
                <ul className="flex space-x-1">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-locaposty-primary hover:bg-blue-50 transition-colors",
                          pathname === item.path &&
                            "text-locaposty-primary bg-blue-50"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-1 text-locaposty-primary"
            >
              <Plus className="h-4 w-4" />
              New Post
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <div className="h-7 w-7 bg-locaposty-primary/10 rounded-full flex items-center justify-center text-locaposty-primary font-medium">
                    JS
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">John Smith</p>
                  <p className="text-xs text-locaposty-text-medium">
                    john@smithscafe.com
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  <span>Your Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20",
            sidebarOpen
              ? "w-64 opacity-100 translate-x-0"
              : isMobile
              ? "w-0 opacity-0 -translate-x-full fixed"
              : "w-20 opacity-100 translate-x-0",
            isMobile && sidebarOpen && "fixed h-full"
          )}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            {(!isMobile || sidebarOpen) && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-locaposty-primary" />
                        {sidebarOpen ? (
                          <span className="truncate">{selectedLocation}</span>
                        ) : (
                          <span>SF</span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {locations.map((location) => (
                      <DropdownMenuItem
                        key={location}
                        onClick={() => setSelectedLocation(location)}
                        className={cn(
                          "cursor-pointer",
                          selectedLocation === location &&
                            "bg-blue-50 text-locaposty-primary"
                        )}
                      >
                        {location}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Location
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="ml-2"
                  >
                    <ChevronLeft
                      className={cn(
                        "h-5 w-5 transition-transform",
                        !sidebarOpen && "rotate-180"
                      )}
                    />
                  </Button>
                )}
                {isMobile && sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="ml-auto"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </>
            )}
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:text-locaposty-primary hover:bg-blue-50 group transition-colors",
                    pathname === "/" &&
                      "text-locaposty-primary bg-blue-50 font-medium"
                  )}
                >
                  <Home className="h-5 w-5" />
                  {sidebarOpen && <span>Home</span>}
                </Link>
              </li>
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:text-locaposty-primary hover:bg-blue-50 group transition-colors",
                      pathname === item.path &&
                        "text-locaposty-primary bg-blue-50 font-medium"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 mt-auto border-t border-gray-100">
            {sidebarOpen ? (
              <Link
                href="/settings"
                className="text-sm text-locaposty-text-medium hover:text-locaposty-primary flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                App Settings
              </Link>
            ) : (
              <Link
                href="/settings"
                className="flex items-center justify-center text-locaposty-text-medium hover:text-locaposty-primary"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
