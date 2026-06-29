using System.IO;
using System.Threading.Tasks;

namespace CiviCore.Api.Services;

public interface ILocalStorageService
{
    Task<string> UploadFileAsync(bool isPrivate, string filePath, Stream fileStream);
    Task<byte[]> DownloadFileAsync(bool isPrivate, string filePath);
    Task RemoveFileAsync(bool isPrivate, string filePath);
}
