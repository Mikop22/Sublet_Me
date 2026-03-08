export const PROTECTED_PATHS = [
  "/dashboard",
  "/create-profile",
  "/assistant",
  "/landlord",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
