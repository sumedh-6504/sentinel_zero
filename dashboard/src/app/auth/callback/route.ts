import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // bookmarkable link
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        // If we land on port 3000 (standard) but want 3002, force the switch
        const targetOrigin = origin.includes("localhost:3000") 
          ? origin.replace("3000", "3002") 
          : origin.includes("localhost") ? origin : "http://localhost:3002";
          
        return NextResponse.redirect(`${targetOrigin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
