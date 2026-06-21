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
            var fromAddress = _config["Smtp:From"] ?? "noreply@civicore.com";
            message.From.Add(new MailboxAddress("CiviCore", fromAddress));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            message.Body = new TextPart("html")
            {
                Text = body
            };

            using var client = new SmtpClient();
            var host = _config["Smtp:Host"] ?? "localhost";
            var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 25;
            var user = _config["Smtp:User"];
            var pass = _config["Smtp:Pass"];
            
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
