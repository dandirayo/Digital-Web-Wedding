"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    localStorage.removeItem("occasio_demo_session");
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
    >
      Logout
    </button>
  );
}
