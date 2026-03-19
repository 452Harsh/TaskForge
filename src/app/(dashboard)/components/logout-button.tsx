"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleLogout} 
      title="Log out"
      className="text-slate-400 hover:text-white hover:bg-slate-800"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Log out</span>
    </Button>
  );
}
