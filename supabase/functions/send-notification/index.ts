import { serve } from "std/http/server.ts"

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Send notification placeholder" }),
    { headers: { "Content-Type": "application/json" } },
  )
})
