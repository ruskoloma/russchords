using BackendApi.Data;
using BackendApi.Services;
using BackendApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Load configuration
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAutoMapper(typeof(Program));

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(opts => opts.UseNpgsql(connectionString));

// Dependency Injection for services
builder.Services.AddTransient<ISongService, SongService>();
builder.Services.AddTransient<ISongStarService, SongStarService>();
builder.Services.AddTransient<IPlaylistService, PlaylistService>();
builder.Services.AddTransient<IPlaylistSongService, PlaylistSongService>();
builder.Services.AddTransient<IPlaylistMemberService, PlaylistMemberService>();
builder.Services.AddTransient<ICachedSongService, CachedSongService>();

builder.Services.AddAWSService<Amazon.DynamoDBv2.IAmazonDynamoDB>();

// CORS policy
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policyBuilder =>
    {
        policyBuilder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Database creation
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
}

// Middleware
// app.UseHttpsRedirection();

app.UseRouting();
app.UseCors();

app.MapControllers();

app.Run();