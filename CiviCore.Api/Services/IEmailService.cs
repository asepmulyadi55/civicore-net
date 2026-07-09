using System.Threading.Tasks;

namespace CiviCore.Api.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body, byte[]? inlineImage = null, string? inlineImageCid = null);
    }
}
