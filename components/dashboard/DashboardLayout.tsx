"use client";
import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  LogOut,
  Search,
  Check,
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import GoogleBusinessLogo from "@/components/svg/GoogleBusinessLogo";

// Define location type
type Location = {
  id: string;
  name: string;
  gmbLocationName: string;
  address?: string;
  logoUrl?: string;
};

interface DashboardLayoutProps {
  children: ReactNode;
  showLocationSelector?: boolean;
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showLocationSelector = true,
  selectedLocationId = "",
  onLocationChange,
}) => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] =
    useState<string>(selectedLocationId);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>("");

  // Fetch locations when session is available
  useEffect(() => {
    const fetchLocations = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          setLoading(true);
          const userId = session.user.id || "no-id";
          const response = await fetch(`/api/locations?userId=${userId}`);

          if (!response.ok) {
            throw new Error("Failed to fetch locations");
          }

          const data = await response.json();
          setLocations(data.locations);
          console.log(data);

          // Set first location as default if available
          if (data.locations.length > 0 && !selectedLocation) {
            const locationToUse = selectedLocationId || data.locations[0].id;
            setSelectedLocation(locationToUse);

            const locationObj = data.locations.find(
              (loc: any) => loc.id === locationToUse
            );
            if (locationObj) {
              setSelectedLocationName(locationObj.gmbLocationName);
            }

            // Notify parent component if callback is provided
            if (onLocationChange && locationToUse !== selectedLocationId) {
              onLocationChange(locationToUse);
            }
          }
        } catch (error) {
          console.error("Error fetching locations:", error);
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [session, status, selectedLocationId]);

  // Update selected location when selectedLocationId prop changes
  useEffect(() => {
    if (selectedLocationId && selectedLocationId !== selectedLocation) {
      setSelectedLocation(selectedLocationId);

      const locationObj = locations.find(
        (loc) => loc.id === selectedLocationId
      );
      if (locationObj) {
        setSelectedLocationName(locationObj.gmbLocationName);
      }
    }
  }, [selectedLocationId, locations]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location.id);
    setSelectedLocationName(location.gmbLocationName);

    // Notify parent component if callback is provided
    if (onLocationChange) {
      onLocationChange(location.id);
    }
  };

  // Filter locations based on search query
  const filteredLocations = locations.filter(
    (location) =>
      location.gmbLocationName
        .toLowerCase()
        .includes(locationSearchQuery.toLowerCase()) ||
      location.address
        ?.toLowerCase()
        .includes(locationSearchQuery.toLowerCase())
  );

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Posts", icon: Calendar, path: "/posts" },
    { name: "Reviews", icon: MessageSquare, path: "/reviews" },
    { name: "Reports", icon: BarChart3, path: "/reports" },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
      subItems: [
        { name: "General", path: "/settings" },
        { name: "Reviews Auto-Reply", path: "/settings/reviews" },
      ],
    },
  ];

  const handleAddLocation = () => {
    // Store the current path for redirection after adding location
    if (typeof window !== "undefined") {
      localStorage.setItem("referringPath", pathname);
    }
  };

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
                    <li key={item.name} className="relative group">
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
                        {item.subItems && (
                          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
                        )}
                      </Link>
                      {item.subItems && (
                        <div className="absolute left-0 mt-1 w-56 rounded-md overflow-hidden bg-white shadow-lg border border-gray-100 z-50 hidden group-hover:block">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.path}
                              className={cn(
                                "block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-locaposty-primary",
                                pathname === subItem.path &&
                                  "text-locaposty-primary bg-blue-50/60"
                              )}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
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

            {status === "authenticated" && session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Avatar className="h-7 w-7">
                      {session.user.image ? (
                        <AvatarImage
                          src={session.user.image}
                          alt={session.user.name || "User"}
                        />
                      ) : null}
                      <AvatarFallback className="bg-locaposty-primary/10 text-locaposty-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-locaposty-text-medium line-clamp-1">
                      {session.user.email || ""}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      <span>Your Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {status === "unauthenticated" && (
              <Button asChild variant="default" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-gray-200 flex flex-col z-20",
            sidebarOpen
              ? "w-72 transition-all duration-300 ease-in-out"
              : isMobile
                ? "w-0 opacity-0 -translate-x-full fixed"
                : "w-16 transition-all duration-300 ease-in-out",
            isMobile && sidebarOpen && "fixed h-full top-0 left-0 shadow-lg"
          )}
        >
          {showLocationSelector && (
            <div className="p-3 flex items-center justify-between border-b border-gray-100 relative z-30">
              {(!isMobile || sidebarOpen) && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 flex items-center justify-between h-auto py-1.5",
                          !sidebarOpen && "w-full px-2",
                          "overflow-hidden text-left"
                        )}
                        disabled={loading || locations.length === 0}
                      >
                        <div className="flex items-center max-w-full overflow-hidden">
                          {selectedLocation &&
                          locations.find((loc) => loc.id === selectedLocation)
                            ?.logoUrl ? (
                            <Avatar className="h-5 w-5 mr-2 flex-shrink-0">
                              <AvatarImage
                                src={
                                  locations.find(
                                    (loc) => loc.id === selectedLocation
                                  )?.logoUrl || ""
                                }
                                alt={selectedLocationName}
                              />
                              <AvatarFallback className="bg-locaposty-primary/10 text-locaposty-primary">
                                <MapPin className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <MapPin className="h-4 w-4 mr-2 text-locaposty-primary flex-shrink-0" />
                          )}
                          {sidebarOpen ? (
                            <div className="flex flex-col overflow-hidden max-w-[140px]">
                              <span className="truncate text-sm font-medium">
                                {loading
                                  ? "Loading..."
                                  : locations.length === 0
                                    ? "No locations"
                                    : selectedLocationName || "Select location"}
                              </span>
                              {selectedLocation &&
                                locations.find(
                                  (loc) => loc.id === selectedLocation
                                )?.address && (
                                  <span className="truncate text-xs text-gray-500">
                                    {
                                      locations.find(
                                        (loc) => loc.id === selectedLocation
                                      )?.address
                                    }
                                  </span>
                                )}
                            </div>
                          ) : (
                            <span className="sr-only">
                              {loading
                                ? "Loading..."
                                : locations.length === 0
                                  ? "No locations"
                                  : selectedLocationName || "Select location"}
                            </span>
                          )}
                        </div>
                        {sidebarOpen && (
                          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={sidebarOpen ? "start" : "start"}
                      side={sidebarOpen ? "bottom" : "right"}
                      sideOffset={sidebarOpen ? 4 : 15}
                      avoidCollisions={false}
                      className="w-[350px] max-w-[95vw] z-50"
                      style={{
                        position: "fixed",
                        maxHeight: "85vh",
                      }}
                    >
                      <div className="p-2">
                        <div className="flex items-center px-2 pb-2">
                          <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <Input
                            value={locationSearchQuery}
                            onChange={(e) =>
                              setLocationSearchQuery(e.target.value)
                            }
                            placeholder="Search locations..."
                            className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>
                      <DropdownMenuSeparator />

                      {/* Selected location display when sidebar is collapsed */}
                      {!sidebarOpen && selectedLocation && (
                        <>
                          <div className="bg-blue-50 p-3 mx-1 rounded-md">
                            <div className="flex items-start gap-2">
                              {locations.find(
                                (loc) => loc.id === selectedLocation
                              )?.logoUrl ? (
                                <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                                  <AvatarImage
                                    src={
                                      locations.find(
                                        (loc) => loc.id === selectedLocation
                                      )?.logoUrl || ""
                                    }
                                    alt={selectedLocationName}
                                  />
                                  <AvatarFallback className="bg-locaposty-primary/10 text-locaposty-primary">
                                    <MapPin className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8 w-8 mt-0.5 flex-shrink-0 rounded-full bg-locaposty-primary/10 flex items-center justify-center">
                                  <MapPin className="h-4 w-4 text-locaposty-primary" />
                                </div>
                              )}
                              <div className="flex flex-col w-full min-w-0">
                                <span className="font-medium text-locaposty-primary break-words hyphens-auto">
                                  {selectedLocationName}
                                </span>
                                {locations.find(
                                  (loc) => loc.id === selectedLocation
                                )?.address && (
                                  <span className="text-xs text-gray-600 break-words hyphens-auto mt-0.5">
                                    {
                                      locations.find(
                                        (loc) => loc.id === selectedLocation
                                      )?.address
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      <div className="max-h-[320px] overflow-y-auto py-1">
                        {filteredLocations.map((location) => (
                          <DropdownMenuItem
                            key={location.id}
                            onClick={() => handleSelectLocation(location)}
                            className={cn(
                              "cursor-pointer flex items-start py-2 px-3 gap-2 min-h-[64px]",
                              selectedLocation === location.id
                                ? "bg-blue-50 text-locaposty-primary"
                                : "hover:bg-gray-50"
                            )}
                          >
                            {location.logoUrl ? (
                              <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                                <AvatarImage
                                  src={location.logoUrl}
                                  alt={location.name}
                                />
                                <AvatarFallback className="bg-locaposty-primary/10 text-locaposty-primary">
                                  <MapPin className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-8 w-8 mt-0.5 flex-shrink-0 rounded-full bg-locaposty-primary/10 flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-locaposty-primary" />
                              </div>
                            )}
                            <div className="flex flex-col w-full min-w-0">
                              <span
                                className={cn(
                                  "text-sm break-words hyphens-auto",
                                  selectedLocation === location.id &&
                                    "font-medium"
                                )}
                              >
                                {location.gmbLocationName}
                              </span>
                              {location.address && (
                                <span className="text-xs text-gray-500 break-words hyphens-auto mt-0.5">
                                  {location.address}
                                </span>
                              )}
                            </div>
                            {selectedLocation === location.id && (
                              <Check className="h-4 w-4 text-locaposty-primary ml-auto flex-shrink-0 mt-1" />
                            )}
                          </DropdownMenuItem>
                        ))}
                        {filteredLocations.length === 0 &&
                          locations.length > 0 && (
                            <div className="px-2 py-3 text-sm text-gray-500 text-center">
                              No locations match your search
                            </div>
                          )}
                        {locations.length === 0 && (
                          <DropdownMenuItem disabled>
                            No locations available
                          </DropdownMenuItem>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/settings/locations/connect"
                          className="cursor-pointer"
                          onClick={handleAddLocation}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Location
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/settings/locations/connect"
                          className="cursor-pointer flex items-center"
                          onClick={handleAddLocation}
                        >
                          <GoogleBusinessLogo className="h-4 w-4 mr-2" />
                          Connect Google Business
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebar}
                      className="ml-2 flex-shrink-0"
                      title={
                        sidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                      }
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
          )}

          {!showLocationSelector && sidebarOpen && (
            <div className="p-3 flex items-center justify-between border-b border-gray-100">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="ml-auto"
                  title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
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
            </div>
          )}

          <nav className="flex-1 p-3 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:text-locaposty-primary hover:bg-blue-50 group transition-colors",
                    pathname === "/" &&
                      "text-locaposty-primary bg-blue-50 font-medium",
                    !sidebarOpen && "justify-center px-0"
                  )}
                >
                  <Home className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">Home</span>}
                </Link>
              </li>
              {navItems.map((item) => (
                <li key={item.name}>
                  <div>
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-locaposty-primary/5 hover:text-locaposty-primary transition-colors",
                        pathname === item.path &&
                          "text-locaposty-primary bg-locaposty-primary/5"
                      )}
                      onClick={() => {
                        if (!item.subItems) setSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-3" />
                        <span>{item.name}</span>
                      </div>
                      {item.subItems && (
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      )}
                    </Link>

                    {item.subItems && (
                      <div className="ml-12 border-l border-gray-100 pl-2">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.path}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm text-gray-600 hover:text-locaposty-primary",
                              pathname === subItem.path &&
                                "text-locaposty-primary font-medium"
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-3 mt-auto border-t border-gray-100">
            {sidebarOpen ? (
              <Link
                href="/settings"
                className="text-sm text-locaposty-text-medium hover:text-locaposty-primary flex items-center gap-2"
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">App Settings</span>
              </Link>
            ) : (
              <Link
                href="/settings"
                className="flex items-center justify-center text-locaposty-text-medium hover:text-locaposty-primary"
                title="App Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}
          </div>
        </aside>

        {/* Overlay when mobile sidebar is open */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-10"
            onClick={toggleSidebar}
          />
        )}

        {/* Collapsed location indicator */}
        {!sidebarOpen &&
          !isMobile &&
          showLocationSelector &&
          selectedLocation && (
            <div
              className="absolute top-4 left-3 z-10 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              title={selectedLocationName || "Expand sidebar"}
            >
              {selectedLocation &&
              locations.find((loc) => loc.id === selectedLocation)?.logoUrl ? (
                <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                  <AvatarImage
                    src={
                      locations.find((loc) => loc.id === selectedLocation)
                        ?.logoUrl || ""
                    }
                    alt={selectedLocationName}
                  />
                  <AvatarFallback className="bg-locaposty-primary text-white">
                    {selectedLocationName?.substring(0, 2) || "L"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-9 w-9 rounded-full bg-locaposty-primary/10 flex items-center justify-center border-2 border-white shadow-md">
                  <MapPin className="h-5 w-5 text-locaposty-primary" />
                </div>
              )}
            </div>
          )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
