import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env"

// singleton instance
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)