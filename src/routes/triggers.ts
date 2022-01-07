import express, { Request, Response } from 'express';

const router = express.Router();

import { triggerRequest } from '../utils/util'; ''


router.post("/search", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'search');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

router.post("/select", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'select');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

router.post("/init", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'init');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

router.post("/confirm", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'confirm');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

router.post("/track", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'track');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

router.post("/status", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'status');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

router.post("/support", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'support');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

router.post("/cancel", async (req: Request, res: Response) => {
    try {
        const response = await triggerRequest(req, 'cancel');
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});

module.exports = router;