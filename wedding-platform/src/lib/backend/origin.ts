export function isSameOrigin(request: Request): boolean {
    try {
        const origin = new URL(request.headers.get("origin") || "");
        return origin.host === request.headers.get("host") &&
            (origin.protocol === "https:" || (process.env.NODE_ENV !== "production" && origin.protocol === "http:"));
    }
    catch {
        return false;
    }
}
