const express = require('express');
import { Request, Response } from "express";
import cors from 'cors';
import { client } from "./db";

const app = express();

//app.use(express.json());
app.use(cors());

app.use(express.json({
  verify: (req: Request, res: Response, buf: Buffer) => {
    req.rawBody = buf.toString();
  }
}));


(async () => {
  try {
    await client.connect();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  if (process.env.sign_public_key === '' || process.env.sign_public_key === undefined || process.env.sign_private_key === '' || process.env.sign_private_key === undefined) {
    throw ("Keys not found");
  }

  const PORT = process.env.PORT || 8000;

  var test_mode = false;
  if (process.env.client_mode === '' || process.env.client_mode === undefined || process.env.protocol_mode === '' || process.env.protocol_mode === undefined) {
    test_mode = true;
  }

  if (process.env.client_mode === 'true' || test_mode) {
    app.use('/trigger', require("./routes/triggers"));
    app.use('/client', require("./routes/client"));
  }
  if (process.env.protocol_mode === 'true' || test_mode) {
    app.use('/protocol', require("./routes/protocol"));
  }
  app.use('/auth', require("./routes/auth"));
  app.listen(PORT, () => {
    console.log(`BAP adaptor listening on port ${PORT}`)
  })
})();