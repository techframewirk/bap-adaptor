import { client } from "../src/db";

export const config = {
    country: process.env.country || 'IND',
    city: process.env.city || 'Kochi',
    bap_id: process.env.bap_id || 'bap.stayhalo.in',
    //bap_id: process.env.bap_id || 'beckn-telegram-bap-cab',
    bap_uri: process.env.bap_uri || 'https://bap.stayhalo.in/protocol/',
    //bap_uri: process.env.bap_uri || 'https://beckn.free.beeceptor.com',
    ttl: 'P1M',
    registry_url: process.env.registry_url || 'https://pilot-gateway-1.beckn.nsdl.co.in',
    //registry_url: 'http://test-mobility-registry.ngrok.io',
    call_webhook: true,
    unique_key_id: process.env.unique_key_id || "29",
    webhook_url: process.env.webhook_url || 'https://beckn.free.beeceptor.com',
    max_retry_count: 2,
    auth: true
}