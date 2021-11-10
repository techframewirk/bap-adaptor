import express, { Request, Response } from 'express';

const router = express.Router();

import { handleCallback } from '../utils/util';
import { auth } from '../utils/auth';

router.post("/on_search", auth, async (req: Request, res: Response) => {
    try {
        await handleCallback(req);
        res.status(200).send({
            message: {
                ack: {
                    status: "ACK"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.post("/on_confirm", auth, async (req: Request, res: Response) => {
    try {
        await handleCallback(req);
        res.status(200).send({
            message: {
                ack: {
                    status: "ACK"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.post("/on_update", auth, async (req: Request, res: Response) => {
    try {
        await handleCallback(req);
        res.status(200).send({
            message: {
                ack: {
                    status: "ACK"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.post("/on_status", auth, async (req: Request, res: Response) => {
    try {
        await handleCallback(req);
        res.status(200).send({
            message: {
                ack: {
                    status: "ACK"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.post("/on_track", auth, async (req: Request, res: Response) => {
    try {
        await handleCallback(req);
        res.status(200).send({
            message: {
                ack: {
                    status: "ACK"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.post("/on_support", auth, async (req: Request, res: Response) => {
    try {
        await handleCallback(req);
        res.status(200).send({
            message: {
                ack: {
                    status: "ACK"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

router.post("/on_cancel", auth, async (req: Request, res: Response) => {
    try {
        await handleCallback(req);
        res.status(200).send({
            message: {
                ack: {
                    status: "ACK"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send((error as Error).message);
    }
});

module.exports = router;