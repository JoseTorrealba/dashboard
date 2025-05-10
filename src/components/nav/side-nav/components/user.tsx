import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function User() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex h-16 items-center border-b border-border px-2">
      <div className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800">
        <div className="flex items-center">
          <Image
            src={user?.image || "/avatar.png"}
            alt="User"
            className="mr-2 rounded-full"
            width={36}
            height={36}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name || "Usuario"}</span>
            <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
