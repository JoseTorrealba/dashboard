import { TopNav } from "@/components/nav";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <>
      <TopNav title="Dashboard" />
      <main>{children}</main>
    </>
  );
}
