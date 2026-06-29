using Supabase;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using System;

namespace CiviCore.Api.Services;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly Client _supabaseClient;
    private readonly IMemoryCache _cache;

    public SupabaseStorageService(Client supabaseClient, IMemoryCache cache)
    {
        _supabaseClient = supabaseClient;
        _cache = cache;
    }

    public async Task<string> UploadFileAsync(string bucketName, string filePath, Stream fileStream)
    {
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();
        
        await _supabaseClient.Storage.From(bucketName).Upload(bytes, filePath, new Supabase.Storage.FileOptions { Upsert = true });
        
        _cache.Remove($"signed_url_{bucketName}_{filePath}");
        
        return filePath;
    }

    public async Task<string> GetSignedUrlAsync(string bucketName, string filePath, int expiresInSeconds = 3600)
    {
        var cacheKey = $"signed_url_{bucketName}_{filePath}";
        if (_cache.TryGetValue(cacheKey, out string? cachedUrl) && !string.IsNullOrEmpty(cachedUrl))
        {
            return cachedUrl;
        }

        var url = await _supabaseClient.Storage.From(bucketName).CreateSignedUrl(filePath, Math.Max(300, expiresInSeconds));
        
        // Cache until 5 minutes before it actually expires in Supabase
        var cacheDuration = TimeSpan.FromSeconds(Math.Max(1, expiresInSeconds - 300));
        _cache.Set(cacheKey, url, cacheDuration);
        
        return url;
    }

    public async Task<byte[]> DownloadFileAsync(string bucketName, string filePath)
    {
        // We use the Supabase SDK to securely download the file directly into memory
        // This keeps the URL hidden from the browser.
        var bytes = await _supabaseClient.Storage.From(bucketName).Download(filePath, null);
        return bytes;
    }

    public async Task RemoveFileAsync(string bucketName, string filePath)
    {
        await _supabaseClient.Storage.From(bucketName).Remove(new System.Collections.Generic.List<string> { filePath });
        _cache.Remove($"signed_url_{bucketName}_{filePath}");
    }
}
