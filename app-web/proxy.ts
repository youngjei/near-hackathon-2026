import { NextResponse, type NextRequest } from "next/server";
import { testAccess } from "./lib/server/test-access";

// Only standalone hosting opts in. Sites has its own trusted identity boundary.
export async function proxy(request: NextRequest) {
  if (process.env.STANDALONE_PRIVATE_ACCESS !== "true") return NextResponse.next();
  return await testAccess(request, process.env) || NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
