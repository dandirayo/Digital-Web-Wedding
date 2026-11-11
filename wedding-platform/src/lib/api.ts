export async function api<T>(action: string, args: unknown[] = []): Promise<T> {
    const response = await fetch("/api/workspace", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, args }), cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
        throw new Error(result.error || "Permintaan gagal.");
    return result.data as T;
}
