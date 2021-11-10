import { MongoClient } from 'mongodb';

import { db } from '../../config/db';



const url = db.mongo_url;
export const client = new MongoClient(url);