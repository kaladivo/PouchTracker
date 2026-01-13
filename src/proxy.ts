import { NextResponse } from "next/server";

export function proxy() {
  const response = NextResponse.next();

  // Required headers for OPFS (Origin Private File System) and SharedArrayBuffer
  // These enable cross-origin isolation needed by Evolu's SQLite WASM
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes that don't need these headers
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
