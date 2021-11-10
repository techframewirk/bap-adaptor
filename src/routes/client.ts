import express, { Request, Response } from 'express';

const router = express.Router();

import { getResponse } from '../utils/util';

router.get("/on_search", async (req: Request, res: Response) => {
    try {
        const message_id: string = req.query.message_id as string;
        const response = await getResponse(message_id, 'on_search');
        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.get("/on_confirm", async (req: Request, res: Response) => {
    try {
        const message_id: string = req.query.message_id as string;
        const response = await getResponse(message_id, 'on_confirm');
        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.get("/on_update", async (req: Request, res: Response) => {
    try {
        const message_id: string = req.query.message_id as string;
        const response = await getResponse(message_id, 'on_update');
        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.get("/on_status", async (req: Request, res: Response) => {
    try {
        const message_id: string = req.query.message_id as string;
        const response = await getResponse(message_id, 'on_status');
        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.get("/on_track", async (req: Request, res: Response) => {
    try {
        const message_id: string = req.query.message_id as string;
        const response = await getResponse(message_id, 'on_track');
        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.get("/on_support", async (req: Request, res: Response) => {
    try {
        const message_id: string = req.query.message_id as string;
        const response = await getResponse(message_id, 'on_track');
        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

module.exports = router;