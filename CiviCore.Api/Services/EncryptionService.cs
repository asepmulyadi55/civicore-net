using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace CiviCore.Api.Services;

public interface IEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}

public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;

    public EncryptionService(IConfiguration config)
    {
        var keyString = config["Encryption:Key"];
        if (string.IsNullOrEmpty(keyString))
        {
            // Fallback for dev if not set
            keyString = "default_dev_key_32_bytes_long_123"; 
        }
        
        _key = Encoding.UTF8.GetBytes(keyString.PadRight(32).Substring(0, 32));
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

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;

        try
        {
            byte[] encryptedData = Convert.FromBase64String(cipherText);

            byte[] nonce = new byte[12];
            byte[] tag = new byte[16];
            byte[] cipherBytes = new byte[encryptedData.Length - nonce.Length - tag.Length];

            Buffer.BlockCopy(encryptedData, 0, nonce, 0, nonce.Length);
            Buffer.BlockCopy(encryptedData, nonce.Length, tag, 0, tag.Length);
            Buffer.BlockCopy(encryptedData, nonce.Length + tag.Length, cipherBytes, 0, cipherBytes.Length);

            byte[] plainBytes = new byte[cipherBytes.Length];

            using (var aes = new AesGcm(_key, tag.Length))
            {
                aes.Decrypt(nonce, cipherBytes, tag, plainBytes);
            }

            return Encoding.UTF8.GetString(plainBytes);
        }
        catch
        {
            return cipherText; // return original if decryption fails (e.g. old format)
        }
    }
}
