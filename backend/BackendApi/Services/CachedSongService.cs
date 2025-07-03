using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Services;

public class CachedSongService : ICachedSongService
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private string _tableName = "CachedSongs";

    public CachedSongService(IAmazonDynamoDB dynamoDb)
    {
        _dynamoDb = dynamoDb;
    }

    public async Task<CachedSongDto?> GetByIdAsync(int id)
    {
        var request = new GetItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                { "id", new AttributeValue { S = id.ToString() } }
            }
        };

        var response = await _dynamoDb.GetItemAsync(request);

        if (response.Item == null || response.Item.Count == 0)
            return null;

        var dto = new CachedSongDto
        {
            Id = id,
            Content = response.Item["content"].S
        };

        return dto;
    }
}