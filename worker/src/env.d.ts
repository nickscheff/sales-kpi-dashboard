// Ergänzt die von `wrangler types` generierte worker-configuration.d.ts um
// das Secret, das nicht in wrangler.jsonc steht (per `wrangler secret put`
// bzw. .dev.vars gesetzt) und daher von wrangler nicht automatisch erkannt wird.
interface Env {
  API_SECRET: string;
}
