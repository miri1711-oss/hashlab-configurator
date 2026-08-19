"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-xs font-semibold text-[var(--text-3)] hover:text-[var(--text-1)] hover:underline"
    >
      Odhlásiť sa
    </button>
  );
}
