using Supabase;
using System.IO;
using System.Threading.Tasks;

namespace CiviCore.Api.Services;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly Client _supabaseClient;

    public SupabaseStorageService(Client supabaseClient)
    {
        _supabaseClient = supabaseClient;
    }

    public async Task<string> UploadFileAsync(string bucketName, string filePath, Stream fileStream)
    {
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();
        
        await _supabaseClient.Storage.From(bucketName).Upload(bytes, filePath, new Supabase.Storage.FileOptions { Upsert = true });
        return filePath;
    }

    public async Task<string> GetSignedUrlAsync(string bucketName, string filePath, int expiresInSeconds = 3600)
    {
        var url = await _supabaseClient.Storage.From(bucketName).CreateSignedUrl(filePath, expiresInSeconds);
        return url;
    }
}
