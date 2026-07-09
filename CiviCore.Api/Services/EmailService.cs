using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace CiviCore.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body, byte[]? inlineImage = null, string? inlineImageCid = null)
        {
            var message = new MimeMessage();
            var fromAddress = _config["MailSettings:FromAddress"] ?? "noreply@civicore.com";
            var fromName = _config["MailSettings:FromName"] ?? "CiviCore";
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            if (inlineImage != null && !string.IsNullOrEmpty(inlineImageCid))
            {
                var builder = new BodyBuilder { HtmlBody = body };
                var image = builder.LinkedResources.Add("image.png", inlineImage, new MimeKit.ContentType("image", "png"));
                image.ContentId = inlineImageCid;
                message.Body = builder.ToMessageBody();
            }
            else
            {
                message.Body = new TextPart("html") { Text = body };
            }

            using var client = new SmtpClient();
            var host = _config["MailSettings:Host"] ?? "localhost";
            var port = int.TryParse(_config["MailSettings:Port"], out var p) ? p : 25;
            var user = _config["MailSettings:Username"];
            var pass = _config["MailSettings:Password"];
            
            try
            {
                // Use Auto so it automatically upgrades to STARTTLS for ports like 587 (Gmail)
                await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.Auto);
                
                if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
                {
                    await client.AuthenticateAsync(user, pass);
                }
                
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                // Throw so the API returns 500 and the frontend sees the real error
                throw new Exception($"Failed to send email: {ex.Message}", ex);
            }
        }
    }
}
