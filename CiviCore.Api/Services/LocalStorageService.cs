using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace CiviCore.Api.Services;

public class LocalStorageService : ILocalStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    
    public LocalStorageService(IWebHostEnvironment env, IConfiguration config)
    {
        _env = env;
        _config = config;
    }

    private string GetBasePath(bool isPrivate)
    {
        if (isPrivate)
        {
            var privatePath = _config["LocalMedia:PrivatePath"] ?? Path.Combine(_env.ContentRootPath, "App_Data", "PrivateMedia");
            if (!Directory.Exists(privatePath)) Directory.CreateDirectory(privatePath);
            return privatePath;
        }
        else
        {
            var publicPath = _config["LocalMedia:PublicPath"] ?? Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "public-media");
            if (!Directory.Exists(publicPath)) Directory.CreateDirectory(publicPath);
            return publicPath;
        }
    }

    public async Task<string> UploadFileAsync(bool isPrivate, string filePath, Stream fileStream)
    {
        var basePath = GetBasePath(isPrivate);
        var fullPath = Path.Combine(basePath, filePath);
        
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using (var fileStreamOutput = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await fileStream.CopyToAsync(fileStreamOutput);
        }

        if (!isPrivate)
        {
            return $"/public-media/{filePath.Replace("\\", "/")}";
        }
        
        return filePath;
    }

    public async Task<byte[]> DownloadFileAsync(bool isPrivate, string filePath)
    {
        var basePath = GetBasePath(isPrivate);
        var fullPath = Path.Combine(basePath, filePath);

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }

        return await File.ReadAllBytesAsync(fullPath);
    }

    public async Task RemoveFileAsync(bool isPrivate, string filePath)
    {
        var basePath = GetBasePath(isPrivate);
        var fullPath = Path.Combine(basePath, filePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
        
        await Task.CompletedTask;
    }
}
