import { createClient } from "@/utils/supabase/server";

const supabase = createClient();

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'example-password',
})