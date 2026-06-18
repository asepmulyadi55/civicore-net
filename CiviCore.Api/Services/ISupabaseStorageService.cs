using System.IO;
using System.Threading.Tasks;

namespace CiviCore.Api.Services;

public interface ISupabaseStorageService
{
    Task<string> UploadFileAsync(string bucketName, string filePath, Stream fileStream);
    Task<string> GetSignedUrlAsync(string bucketName, string filePath, int expiresInSeconds = 3600);
}
