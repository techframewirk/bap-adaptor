import _sodium, { base64_variants } from 'libsodium-wrappers';
import { Request, Response, NextFunction } from "express";
const axios = require('axios').default;
const { config } = require('../../config/config');

import key from '../../config/key';
import { lookupCache } from '../../config/cache';

export const createKeyPair = async () => {
    await _sodium.ready;
    const sodium = _sodium;
    let { publicKey, privateKey } = sodium.crypto_sign_keypair();
    const publicKey_base64 = sodium.to_base64(publicKey, base64_variants.ORIGINAL);
    const privateKey_base64 = sodium.to_base64(privateKey, base64_variants.ORIGINAL);
    console.log("public_key", publicKey_base64);
    console.log("public_key", privateKey_base64);
    console.log("Key pair created");
}

export function combineURLs(baseURL: string, relativeURL: string) {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
}

export const createSigningString = async (message: string, created?: string, expires?: string) => {
    if (!created) created = Math.floor(new Date().getTime() / 1000).toString();
    //if (!created) created = Math.floor(new Date().getTime() / 1000 - (1*60)).toString(); //TO USE IN CASE OF TIME ISSUE
    if (!expires) expires = (parseInt(created) + (1 * 60 * 60)).toString(); //Add required time to create expired
    //const digest = createBlakeHash('blake512').update(JSON.stringify(message)).digest("base64");
    //const digest = blake2.createHash('blake2b', { digestLength: 64 }).update(Buffer.from(message)).digest("base64");
    await _sodium.ready;
    const sodium = _sodium;
    const digest = sodium.crypto_generichash(64, sodium.from_string(message));
    const digest_base64 = sodium.to_base64(digest, base64_variants.ORIGINAL);
    const signing_string =
        `(created): ${created}
(expires): ${expires}
digest: BLAKE-512=${digest_base64}`
    console.log(signing_string, message);
    return { signing_string, expires, created }
}

export const signMessage = async (signing_string: string, privateKey: string) => {
    await _sodium.ready;
    const sodium = _sodium;
    const signedMessage = sodium.crypto_sign_detached(signing_string, sodium.from_base64(privateKey, base64_variants.ORIGINAL));
    return sodium.to_base64(signedMessage, base64_variants.ORIGINAL);
}

export const createAuthorizationHeader = async (message: any) => {
    const { signing_string, expires, created } = await createSigningString(JSON.stringify(message));
    const signature = await signMessage(signing_string, process.env.sign_private_key || "");
    const subscriber_id = config.bap_id;
    const header = `Signature keyId="${subscriber_id}|${config.unique_key_id}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`
    return header;
}


export const verifyMessage = async (signedString: string, signingString: string, publicKey: string) => {
    try {
        await _sodium.ready;
        const sodium = _sodium;
        return sodium.crypto_sign_verify_detached(sodium.from_base64(signedString, base64_variants.ORIGINAL), signingString, sodium.from_base64(publicKey, base64_variants.ORIGINAL));
    } catch (error) {
        return false
    }
}

const remove_quotes = (value: string) => {
    if (value.length >= 2 && value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') {
        value = value.substring(1, value.length - 1)
    }
    return value;
}

const split_auth_header_space = (auth_header: string) => {
    const header = auth_header.replace('Signature ', '');
    let re = /\s*([^=]+)=\"([^"]+)"/g;
    let m;
    let parts: any = {}
    while ((m = re.exec(header)) !== null) {
        if (m) {
            parts[m[1]] = m[2];
        }
    }
    return parts;
}

const split_auth_header = (auth_header: string) => {
    const header = auth_header.replace('Signature ', '');
    let re = /\s*([^=]+)=([^,]+)[,]?/g;
    let m;
    let parts: any = {}
    while ((m = re.exec(header)) !== null) {
        if (m) {
            parts[m[1]] = remove_quotes(m[2]);
        }
    }
    return parts;
}

const verifyHeader = async (header: string, req: Request) => {
    try {
        const parts = split_auth_header(header);
        if (!parts || Object.keys(parts).length === 0) {
            throw (new Error("Header parsing failed"));
        }
        const subscriber_id = parts['keyId'].split('|')[0];
        const unique_key_id = parts['keyId'].split('|')[1];
        const subscriber_details = await lookupRegistry(subscriber_id, unique_key_id);
        console.log(req.body?.context?.transaction_id, subscriber_details);
        const public_key = subscriber_details.signing_public_key;
        console.log(req.rawBody);
        console.log(req.body?.context?.transaction_id, "recreating signing string")
        console.log(parts);
        const { signing_string } = await createSigningString(req.rawBody, parts['created'], parts['expires']);
        const verified = await verifyMessage(parts['signature'], signing_string, public_key);
        if (!verified) {
            lookupCache.del(subscriber_id);
        }
        return verified;
    } catch (error) {
        console.log((error as Error).message);
        return false;
    }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("\nNew Request txn_id", req.body?.context?.transaction_id);
        if (req.body?.context?.bap_id) {
            console.log(req.body?.context?.transaction_id, "Request from", req.body?.context?.bpp_id)
        }
        const auth_header = req.headers['authorization'] || "";
        const proxy_header = req.headers['proxy-authorization'] || "";
        console.log(req.body?.context?.transaction_id, "headers", req.headers )
        if (config.auth) {
            var verified = await verifyHeader(auth_header, req);
            var verified_proxy = proxy_header ? await verifyHeader(proxy_header, req) : true;
            console.log(req.body?.context?.transaction_id, "Verification status:", verified, "Proxy verification:", verified_proxy);
            if (!verified || !verified_proxy) {
                throw Error("Header verification failed");
            }
        }
        next();
    } catch (e) {
        console.log(req.body?.context?.transaction_id, (e as Error).message);
        res.status(401).send('Authentication failed');
    }
}

const lookupRegistry = async (subscriber_id: string, unique_key_id: string) => {
    const subscriber_details = lookupCache.get(subscriber_id);
    if (subscriber_details) {
        console.log("Getting details from cache")
        return subscriber_details;
    }
    try {
        /*const header = await createAuthorizationHeader({ subscriber_id });
        const axios_config = {
            headers: {
                Authorization: header
            }
        }*/
        console.log("Looking up registry ",subscriber_id, unique_key_id);
        const response = await axios.post(combineURLs(config.registry_url, '/lookup'), { subscriber_id });
        if (response.data) {
            if (response.data.length === 0 || response.data?.status === 0) {
                throw (new Error("Subscriber not found"));
            }
            console.log(response.data);
            const { subscriber_id, valid_until } = response.data[0]
            const ttl = new Date(valid_until).valueOf() - new Date().valueOf() / 1000
            lookupCache.set(subscriber_id, response.data[0], ttl);
        }
        return response.data[0];
    } catch (error) {
        console.log(error);
    }
}