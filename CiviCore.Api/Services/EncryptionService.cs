using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace CiviCore.Api.Services;

public interface IEncryptionService
{
    string Encrypt(string plainText);

    /// <summary>
    /// Returns the input unchanged when it cannot be decrypted, so legacy plaintext keeps
    /// working. That also hides genuine failures — use <see cref="TryDecrypt"/> when you
    /// need to know.
    /// </summary>
    string Decrypt(string cipherText);

    /// <summary>
    /// Decrypts, reporting success rather than swallowing it. Required by the key
    /// migration: re-encrypting a value we failed to decrypt would destroy it.
    /// </summary>
    bool TryDecrypt(string cipherText, out string plainText);
}

public class EncryptionService : IEncryptionService
{
    /// <summary>
    /// Used when Encryption:Key is unset. It is compiled into the source and therefore
    /// public — anything protected by it is protected in name only.
    /// </summary>
    internal const string InsecureFallbackKey = "default_dev_key_32_bytes_long_123";

    private readonly byte[] _key;

    public EncryptionService(IConfiguration config)
        : this(DeriveKey(config["Encryption:Key"])) { }

    private EncryptionService(byte[] key) => _key = key;

    /// <summary>Builds a service around an explicit key. Only the key migration needs this.</summary>
    public static EncryptionService WithRawKey(string key) => new(DeriveKey(key));

    private static byte[] DeriveKey(string? keyString)
    {
        if (string.IsNullOrEmpty(keyString)) keyString = InsecureFallbackKey;

        // NOTE: a short key is padded rather than rejected, so it is silently accepted at
        // far lower entropy than its length suggests.
        return Encoding.UTF8.GetBytes(keyString.PadRight(32).Substring(0, 32));
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;

        byte[] nonce = new byte[12];
        RandomNumberGenerator.Fill(nonce);

        byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
        byte[] cipherBytes = new byte[plainBytes.Length];
        byte[] tag = new byte[16];

        using (var aes = new AesGcm(_key, tag.Length))
        {
            aes.Encrypt(nonce, plainBytes, cipherBytes, tag);
        }

        var result = new byte[nonce.Length + tag.Length + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, result, nonce.Length, tag.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, nonce.Length + tag.Length, cipherBytes.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string cipherText) =>
        TryDecrypt(cipherText, out var plainText) ? plainText : cipherText;

    public bool TryDecrypt(string cipherText, out string plainText)
    {
        plainText = cipherText;
        if (string.IsNullOrEmpty(cipherText)) return false;

        try
        {
            byte[] encryptedData = Convert.FromBase64String(cipherText);

            byte[] nonce = new byte[12];
            byte[] tag = new byte[16];

            // Anything shorter cannot hold a nonce + tag, so it was never our ciphertext.
            if (encryptedData.Length <= nonce.Length + tag.Length) return false;

            byte[] cipherBytes = new byte[encryptedData.Length - nonce.Length - tag.Length];

            Buffer.BlockCopy(encryptedData, 0, nonce, 0, nonce.Length);
            Buffer.BlockCopy(encryptedData, nonce.Length, tag, 0, tag.Length);
            Buffer.BlockCopy(encryptedData, nonce.Length + tag.Length, cipherBytes, 0, cipherBytes.Length);

            byte[] plainBytes = new byte[cipherBytes.Length];

            using (var aes = new AesGcm(_key, tag.Length))
            {
                // Throws if the tag check fails — i.e. wrong key, or tampered data.
                aes.Decrypt(nonce, cipherBytes, tag, plainBytes);
            }

            plainText = Encoding.UTF8.GetString(plainBytes);
            return true;
        }
        catch
        {
            plainText = cipherText;
            return false;
        }
    }
}
