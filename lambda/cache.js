import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { EXPIRES_AT, REGION } from './utils/constants.js';
import { getParam } from './utils/functions.js';

const TABLE_NAME = await getParam('/russchords/dev/lambda/table-name');

const ddbClient = new DynamoDBClient({
	region: REGION,
});

const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

export async function writeCache(songId, text) {
	const params = {
		TableName: TABLE_NAME,
		Item: {
			id: songId,
			content: text,
			createdAt: new Date().toISOString(),
			expiresAt: EXPIRES_AT,
		},
	};

	try {
		await dynamoDb.send(new PutCommand(params));
		console.log(`Successfully cached song with id: ${songId}`);
	} catch (error) {
		console.error(`Error caching song with id: ${songId}`, error);
		throw error;
	}
}

export async function readCache(songId) {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			id: songId,
		},
	};

	try {
		const result = await dynamoDb.send(new GetCommand(params));
		if (!result.Item) {
			console.log(`No song found in cache for id: ${songId}`);
			return null;
		}
		console.log(`Successfully retrieved song with id: ${songId}`);
		return result.Item.content;
	} catch (error) {
		console.error(`Error retrieving song with id: ${songId}`, error);
		throw error;
	}
}
