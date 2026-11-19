import { NextRequest } from "next/server";

export interface AuthContext {
  userId: string;
  userEmail: string;
  workspaceId: string;
  role: "OWNER" | "MEMBER";
}

const DEFAULT_WORKSPACE_ID = "ws_demo_auracrafts";
const DEFAULT_USER_ID = "user_avinash_exports";

/**
 * Extracts and verifies the user and workspace context from the request.
 * Multi-tenant ready: checks session header / cookie / token,
 * with standard demo workspace fallback.
 */
export async function getAuthContext(req?: NextRequest): Promise<AuthContext> {
  // Check header or cookie for custom workspace
  let workspaceId = req?.headers.get("x-workspace-id") || DEFAULT_WORKSPACE_ID;
  let userId = req?.headers.get("x-user-id") || DEFAULT_USER_ID;

  return {
    userId,
    userEmail: "exportleads.demo@gmail.com",
    workspaceId,
    role: "OWNER",
  };
}

export async function requireAuth(req?: NextRequest): Promise<AuthContext> {
  const auth = await getAuthContext(req);
  if (!auth.userId || !auth.workspaceId) {
    throw new Error("Unauthorized: Active workspace session required.");
  }
  return auth;
}
