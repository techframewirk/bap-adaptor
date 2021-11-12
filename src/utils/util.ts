import axios from "axios";
import { Request } from "express";
import { config } from "../../config/config";
import { createAuthorizationHeader } from "./auth";
import { v4 as uuidv4 } from 'uuid';
import { db } from "../../config/db";
import { client } from "../db";
import { lookupCache } from '../../config/cache';

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
        var subscribers = [];
        if (bpp_uri) {
            subscribers.push({ subscriber_url: bpp_uri, type: 'bpp' });
        } else {
            subscribers = await lookupRegistry({ type: 'BG', domain })
        }
        /*
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
        */
        await makeRequest(subscribers, body, axios_config);
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

const makeRequest = async (subscribers: any, body: any, axios_config: any) => {
    console.log(subscribers)
    if (subscribers[0].type.toLowerCase() === 'bg') {
        var retry = true;
        var index = 0;
        while (retry) {
            var subscriber_url = subscribers[index].subscriber_url;
            var trigger_url = combineURLs(subscriber_url, `/${body.context.action}`);
            console.log(body?.context?.transaction_id, "Attempt number", index+1);
            console.log(body?.context?.transaction_id, "Triggering", body.context.action, trigger_url);
            console.log(body?.context?.transaction_id, "headers", axios_config.headers);
            console.log(JSON.stringify(body));
            console.log(body?.context.transaction_id, "Endpoint :", trigger_url);
            console.log(body?.context.transaction_id, "headers", axios_config.headers);
            try {
                const response = await axios.post(trigger_url, body, axios_config);
                console.log(body?.context?.transaction_id, 'Response :', response.status, response.data);
                retry = false;
            } catch (error) {
                console.log(body?.context?.transaction_id, "Error invoking search to BG ", trigger_url);
                if (error) {
                    if (axios.isAxiosError(error)) {
                        console.log(body?.context?.transaction_id, "Received status ", error?.response?.status);
                        console.log(body?.context?.transaction_id, "Received response ", error?.response?.data);
                    }
                }
                index++;
                if (index > subscribers.length-1) {
                    throw("Gateway search failed");
                }
            }
        }
    } else {
        var subscriber_url = subscribers[0].subscriber_url;
        var trigger_url = combineURLs(subscriber_url, `/${body.context.action}`);
        console.log(body?.context?.transaction_id, "Triggering", body.context.action);
        console.log(body?.context?.transaction_id, "headers", axios_config.headers);
        console.log(JSON.stringify(body));
        console.log(body?.context.transaction_id, "Endpoint :", trigger_url);
        console.log(body?.context.transaction_id, "headers", axios_config.headers);
        const response = await axios.post(trigger_url, body, axios_config);
        console.log(body?.context?.transaction_id, 'Response :', response.status, response.data);
    }
}

const shuffle = (array: any[]) => {
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
    if (core_version === '0.8.2') {
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
    if (type === 'BG' && domain) {
        const subscriber_details = lookupCache.get('bg ' + domain);
        if (subscriber_details) {
            console.log("Getting BG details from cache")
            return shuffle(subscriber_details);
        }
    }
    console.log("Looking up registry", type || id);
    const registry_url = combineURLs(config.registry_url, '/lookup');
    const request = type ? { type, domain } : { id };
    try {
        const response = await axios.post(registry_url, request, { timeout: 3000 });
        if (response.data.length === 0) {
            throw ("No subscribers found");
        }
        lookupCache.set('bg ' + domain, response.data, 60 * 5);
        const lookup_data = shuffle(response.data);
        return lookup_data;
    } catch (error) {
        console.log("lookup error", error)
        throw ("Lookup error");
    }
}