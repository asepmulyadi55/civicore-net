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

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var message = new MimeMessage();
            var fromAddress = _config["MailSettings:FromAddress"] ?? "noreply@civicore.com";
            var fromName = _config["MailSettings:FromName"] ?? "CiviCore";
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            message.Body = new TextPart("html")
            {
                Text = body
            };

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
            catch
            {
                // Ignore in dev if SMTP not running
            }
        }
    }
}
