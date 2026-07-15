using CiviCore.Api.Services;
using Microsoft.Extensions.Configuration;

namespace CiviCore.Tests;

/// <summary>
/// EncryptionService protects FamilyCardNumber (Nomor KK) — the only field in the system
/// that is encrypted at rest — and had no tests at all.
/// </summary>
public class EncryptionServiceTests
{
    private static EncryptionService WithKey(string? key) =>
        new(new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Encryption:Key"] = key })
            .Build());

    private static EncryptionService Service() => WithKey("test_key_that_is_32_bytes_long!!");

    [Fact]
    public void Round_Trips_A_Value()
    {
        var sut = Service();
        const string kk = "3273010101900001";

        Assert.Equal(kk, sut.Decrypt(sut.Encrypt(kk)));
    }

    [Fact]
    public void Ciphertext_Does_Not_Contain_The_Plaintext()
    {
        var sut = Service();
        const string kk = "3273010101900001";

        Assert.DoesNotContain(kk, sut.Encrypt(kk));
    }

    // AES-GCM uses a random nonce per call, so identical inputs must not produce
    // identical ciphertext — otherwise equal KK numbers would be linkable in the database.
    [Fact]
    public void Same_Input_Encrypts_Differently_Each_Time()
    {
        var sut = Service();
        const string kk = "3273010101900001";

        Assert.NotEqual(sut.Encrypt(kk), sut.Encrypt(kk));
    }

    [Fact]
    public void Both_Ciphertexts_Still_Decrypt_To_The_Same_Value()
    {
        var sut = Service();
        const string kk = "3273010101900001";

        Assert.Equal(kk, sut.Decrypt(sut.Encrypt(kk)));
        Assert.Equal(kk, sut.Decrypt(sut.Encrypt(kk)));
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Empty_Input_Passes_Through(string? input)
    {
        var sut = Service();

        Assert.Equal(input, sut.Encrypt(input!));
        Assert.Equal(input, sut.Decrypt(input!));
    }

    [Fact]
    public void Handles_Unicode()
    {
        var sut = Service();
        const string value = "Aisyah Núñez 中文 🏠";

        Assert.Equal(value, sut.Decrypt(sut.Encrypt(value)));
    }

    [Fact]
    public void Handles_Long_Values()
    {
        var sut = Service();
        var value = new string('9', 5000);

        Assert.Equal(value, sut.Decrypt(sut.Encrypt(value)));
    }

    // The point of encrypting at rest: a different key must not read the data.
    [Fact]
    public void A_Different_Key_Cannot_Read_The_Data()
    {
        var cipher = WithKey("test_key_that_is_32_bytes_long!!").Encrypt("3273010101900001");
        var other = WithKey("a_completely_different_key_here!").Decrypt(cipher);

        Assert.NotEqual("3273010101900001", other);
    }

    // Documents current behaviour rather than endorsing it: Decrypt swallows all failures
    // and returns its input. That keeps legacy plaintext readable, but it also means a
    // *tampered* value fails silently instead of surfacing — AES-GCM's tag check is
    // detecting tampering and the catch is throwing that signal away.
    [Fact]
    public void Undecryptable_Input_Is_Returned_Unchanged()
    {
        var sut = Service();

        Assert.Equal("not-base64-at-all", sut.Decrypt("not-base64-at-all"));
    }

    [Fact]
    public void Tampered_Ciphertext_Fails_Silently_Rather_Than_Throwing()
    {
        var sut = Service();
        var cipher = sut.Encrypt("3273010101900001");

        // Flip a character in the middle of the payload.
        var chars = cipher.ToCharArray();
        chars[chars.Length / 2] = chars[chars.Length / 2] == 'A' ? 'B' : 'A';
        var tampered = new string(chars);

        var result = sut.Decrypt(tampered);

        // It does not throw, and it does not return the original value.
        Assert.NotEqual("3273010101900001", result);
    }

    // Guards the sharp edge in the constructor: keys are padded to 32 bytes, so a short
    // key is silently accepted at far lower entropy than it appears.
    [Fact]
    public void A_Short_Key_Is_Padded_Rather_Than_Rejected()
    {
        var sut = WithKey("short");

        Assert.Equal("3273010101900001", sut.Decrypt(sut.Encrypt("3273010101900001")));
    }

    // With no configured key the service falls back to a constant compiled into the
    // source. This test pins that the fallback *works*; it is not an endorsement — see
    // the handover note about configuring Encryption:Key.
    [Fact]
    public void Falls_Back_To_A_Built_In_Key_When_Unconfigured()
    {
        var sut = WithKey(null);

        Assert.Equal("3273010101900001", sut.Decrypt(sut.Encrypt("3273010101900001")));
    }
}
