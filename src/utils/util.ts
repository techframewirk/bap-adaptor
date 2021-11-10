import axios from "axios";
import { Request } from "express";
import { config } from "../../config/config";
import { createAuthorizationHeader } from "./auth";
import { v4 as uuidv4 } from 'uuid';
import { db } from "../../config/db";
import { client } from "../db";

export const triggerRequest = async (req: Request, action: string) => {
    //const action = req.body.context.action;
    const transaction_id = req.body?.context?.transaction_id;
    const bpp_id = req.body?.context?.bpp_id;
    const bpp_uri = req.body?.context?.bpp_uri;
    const core_version = req.body?.context?.core_version;
    const domain = req.body?.context?.domain;
    const context = buildContext(action, core_version, domain, transaction_id, bpp_id, bpp_uri);
    console.log(context.transaction_id, "Triggering", action);
    const body = {
        context,
        message: req.body.message
    };
    const axios_config = await createHeaderConfig(body);
    try {
        if (action !== 'search') {
            if (!(transaction_id) || !(bpp_uri) || !(bpp_id)) {
                throw (new Error("transaction_id, bpp_uri and bpp_id are required for non search calls"));
            }
        }
        const { subscriber_url } = !(bpp_uri) ?
            await lookupRegistry({ type: 'BG', domain }) :
            { subscriber_url: bpp_uri }
        //await lookupRegistry({ id: req.body.context.bpp_id });
        const trigger_url = combineURLs(subscriber_url, `/${action}`);
        console.log(context.transaction_id, "Triggering", action);
        console.log(context.transaction_id, "headers", axios_config.headers);
        console.log(JSON.stringify(body));
        console.log(context.transaction_id, "Endpoint :", trigger_url);
        const response = await axios.post(trigger_url, body, axios_config);
        console.log(response.data);
    } catch (error) {
        console.log(error);
        if (error instanceof Error) {
            return {
                context,
                message: {
                    ack: {
                        status: "NACK"
                    }
                },
                error: {
                    message: error.message
                }
            };
        }
    }
    return {
        context,
        message: {
            ack: {
                status: "ACK"
            }
        }
    };
}

const shuffle = (array : any[]) => {
    var m = array.length, t, i;
    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);
        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

export const handleCallback = async (req: Request) => {
    console.log(req.body?.context?.transaction_id, "Receiving response callback");
    if (config.call_webhook) {
        try {
            console.log(req.body?.context?.transaction_id, "Forwarding response to ", config.webhook_url)
            await axios.post(config.webhook_url, req.body, { timeout: 3000 });
        } catch (error) {
            console.log(req.body?.context?.transaction_id, (error as Error).message)
        }
    }
    const action = req.body.context.action;
    const database = client.db(db.db_name);
    const collection = database.collection(`${action}_responses`);
    const insert_result = await collection.insertOne(req.body);
    console.log(req.body?.context?.transaction_id, action, "response saved to db");
}

export const getResponse = async (message_id: string, action: string) => {
    const database = client.db(db.db_name);
    const collection = database.collection(`${action}_responses`);
    const result = await collection.find({ 'context.message_id': message_id }).toArray();
    return (result);
}

export function combineURLs(baseURL: string, relativeURL: string) {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
}

const buildContext = (action: string, core_version: string, domain: string, transaction_id?: string, bpp_id?: string, bpp_uri?: string) => {
    const message_id = uuidv4();
    const timestamp = new Date().toISOString();
    if (!transaction_id) {
        transaction_id = uuidv4();
    }
    const context: any = {
        domain: domain,
        country: config.country,
        city: config.city,
        action,
        core_version: core_version,
        bap_id: config.bap_id,
        bap_uri: config.bap_uri,
        transaction_id,
        message_id,
        timestamp,
        ttl: config.ttl
    }
    if(core_version === '0.8.2') {
        context.domain_version = core_version
    }
    if (bpp_id) {
        context.bpp_id = bpp_id
    }
    if (bpp_uri) {
        context.bpp_uri = bpp_uri
    }
    return context;
}

const random = (max: number) => {
    return Math.floor(Math.random() * (max - 0 + 1)) + 0;
}

const createHeaderConfig = async (request: any) => {
    const header = await createAuthorizationHeader(request);
    const axios_config = {
        headers: {
            Authorization: header
        },
        timeout: 3000
    }
    return axios_config;
}

const lookupRegistry = async ({ type, id, domain }: { type?: string, id?: string, domain?: string }) => {
    console.log("Looking up registry", type || id);
    const registry_url = combineURLs(config.registry_url, '/lookup');
    const request = type ? { type, domain } : { id };
    //const axios_config = await createHeaderConfig(request)
    try {
        /*if(type === 'BG') {
            return {subscriber_url : 'http://test-mobility-gateway.ngrok.io/v1/', subscriber_id: "http://test-mobility-gateway.ngrok.io"}
        }*/
        const response = await axios.post(registry_url, request, { timeout: 3000 });
        //const index = type === 'BG' ? random(response.data.length - 1) : 0;
        const index = type === 'BG' ? 1 : 0;
        const lookup_data = response.data[index];
        return lookup_data;
    } catch (error) {
        console.log("lookup error", error)
        throw ("Lookup error");
    }
}