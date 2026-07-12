namespace CiviCore.Api.Services;

public interface IRecaptchaService
{
    Task<bool> ValidateAsync(string token, float minimumScore = 0.5f, string expectedAction = "login");
}

public class RecaptchaService : IRecaptchaService
{
    private readonly HttpClient _http;
    private readonly string _secretKey;
    private readonly ILogger<RecaptchaService> _logger;
    private readonly IWebHostEnvironment _env;

    public RecaptchaService(HttpClient http, IConfiguration config, ILogger<RecaptchaService> logger, IWebHostEnvironment env)
    {
        _http = http;
        _logger = logger;
        _env = env;
        _secretKey = config["Recaptcha:SecretKey"] ?? throw new InvalidOperationException("Recaptcha:SecretKey is not configured.");
    }

    public async Task<bool> ValidateAsync(string token, float minimumScore = 0.5f, string expectedAction = "login")
    {
        if (string.IsNullOrWhiteSpace(token)) return false;

        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsync(
                $"https://www.google.com/recaptcha/api/siteverify?secret={_secretKey}&response={token}",
                null);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to reach Google reCAPTCHA API.");
            if (_env.IsDevelopment())
            {
                _logger.LogWarning("Bypassing CAPTCHA verification in Development environment due to network error.");
                return true;
            }
            return false;
        }

        if (!response.IsSuccessStatusCode) return false;

        var json = await response.Content.ReadFromJsonAsync<RecaptchaResponse>();
        
        if (json == null) return false;
        
        if (json.Success == false)
            _logger.LogWarning("CAPTCHA validation failed from Google: {Errors}", string.Join(", ", json.ErrorCodes ?? new string[0]));
        else if (json.Score < minimumScore)
            _logger.LogWarning("CAPTCHA score {Score} is below minimum {MinimumScore} for action {Action}", json.Score, minimumScore, json.Action);
            
        return json.Success == true && json.Score >= minimumScore && (string.IsNullOrEmpty(expectedAction) || json.Action == expectedAction);
    }
}

internal class RecaptchaResponse
{
    public bool Success { get; set; }
    public float Score { get; set; }
    public string? Action { get; set; }
    public string? Hostname { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("error-codes")]
    public string[]? ErrorCodes { get; set; }
}
