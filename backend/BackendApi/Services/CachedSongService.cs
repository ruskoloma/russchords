using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Services;

public class CachedSongService : ICachedSongService
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;

    public CachedSongService(IAmazonDynamoDB dynamoDb, IConfiguration configuration)
    {
        _dynamoDb = dynamoDb;
        _tableName = configuration["TableNameDDB"]!;
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

        var item = response.Item;

        var dto = new CachedSongDto
        {
            Id = id,
            Name = item.ContainsKey("name") ? item["name"].S : string.Empty,
            Artist = item.ContainsKey("artist") ? item["artist"].S : string.Empty,
            Content = item.ContainsKey("content") ? item["content"].S : string.Empty,
            OriginalUrl = item.ContainsKey("original_url") ? item["original_url"].S : string.Empty
        };

        return dto;
    }
}