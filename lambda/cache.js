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

export async function writeCache(songId, song) {
	const params = {
		TableName: TABLE_NAME,
		Item: {
			id: songId,
			name: song.name,
			artist: song.artist,
			content: song.content,
			original_url: song.original_url,
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
		return {
			name: result.Item.name,
			artist: result.Item.artist,
			content: result.Item.content,
			original_url: result.Item.original_url,
		};
	} catch (error) {
		console.error(`Error retrieving song with id: ${songId}`, error);
		throw error;
	}
}