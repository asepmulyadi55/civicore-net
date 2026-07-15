# Encryption Key Setup & Migration

How to give CiviCore a real encryption key, and how to move existing data onto it.

**This document contains no secrets and is safe to commit.** The key itself lives in
`.env`, which is gitignored.

---

## Why this exists

`Householder.FamilyCardNumber` (Nomor KK) is the one field encrypted at rest. The cipher
is fine — AES-GCM with a random nonce per value. The **key** is the problem.

`EncryptionService` reads the key from `Encryption:Key`. That was never configured, so it
silently fell back to a constant compiled into the source
(`EncryptionService.InsecureFallbackKey`). That constant is in the git repository and in
every built image, so anyone who can read either can decrypt every KK number in a database
dump.

Nothing is protected until the steps below are done.

### Why you can't just set a new key

Existing rows are encrypted with the old fallback key. Point the app at a new key and it
can no longer read them.

Worse, it won't say so. `EncryptionService.Decrypt()` returns its input when decryption
fails, so instead of an error you'd get ciphertext where a KK number should be — silent
corruption. Hence the migration: it re-encrypts existing data onto the new key.

---

## Before you start

- [ ] You can reach the production database.
- [ ] You have `docker compose` on the host.
- [ ] You can take a backup and restore it. **Do not skip this.**

---

## Step 0 — Back up

```bash
pg_dump "postgresql://USER:PASS@HOST:5432/postgres" -t '"Householders"' -f kk_backup.sql
```

The migration is idempotent and safe to re-run, but a backup is the only thing that saves
you if something *outside* the migration goes wrong.

---

## Step 1 — Generate a key

Exactly **32 characters**. Shorter is padded (weaker than it looks); longer is truncated.

PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```

bash:

```bash
LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32; echo
```

Do not paste it into chat, a ticket, or a commit. Store it in your password manager — if
you lose it, the encrypted data is unrecoverable.

---

## Step 2 — Put it in `.env`

```bash
cp .env.example .env
```

Set the value:

```
ENCRYPTION_KEY=<your 32 characters>
```

`.env` is gitignored. `docker-compose.yml` reads it automatically.

> **Not `appsettings.json`.** `.dockerignore` does not exclude that file, so `COPY . .`
> bakes it into the image — the key would ship inside the artifact. Same mistake, new
> location.

Compose is wired with `${ENCRYPTION_KEY:?...}`, so **`docker compose up` refuses to start
without it**. That is deliberate: a missing key must fail loudly, not silently fall back to
the public one.

---

## Step 3 — Dry run

```bash
docker compose run --rm api --reencrypt-kk --dry-run
```

(The image's entrypoint is `dotnet CiviCore.Api.dll`, so these flags append to it.)

Expected:

```
  rows with a value : 187
  re-encrypted      : 187
  already on new key: 0
  UNDECRYPTABLE     : 0

DRY RUN — nothing was written. Re-run with --apply once the numbers look right.
```

**Nothing is written in a dry run.**

Check:

| Line | Should be | If not |
|---|---|---|
| `rows with a value` | roughly your householder count | wrong database? |
| `re-encrypted` | the same number | see below |
| `already on new key` | `0` on a first run | a previous run partly completed — fine, continue |
| `UNDECRYPTABLE` | **`0`** | **stop** — see Troubleshooting |

---

## Step 4 — Apply

```bash
docker compose run --rm api --reencrypt-kk --apply
```

Exit code is non-zero if anything was undecryptable.

---

## Step 5 — Restart on the new key

```bash
docker compose up -d api
```

### About the gap between steps 4 and 5

Narrower than it looks. No read path decrypts the KK number any more — it was removed from
`GET /api/householders` and `GET /api/householders/{id}` — so nothing displays it and
nothing can show scrambled text.

The only edge: if someone *edits* a householder in that window, the still-running old
container re-encrypts that row with the **old** key. Harmless, and re-running step 4
sweeps it up. The command is idempotent precisely so you can do that without thinking.

---

## Step 6 — Close the door

Once step 4 has succeeded, `EncryptionService.DeriveKey` should **throw** on a missing key
instead of falling back, so this can never recur silently.

Not enabled yet: turning it on before the migration would simply stop the app booting.
Ask, and it's a one-line change.

---

## Troubleshooting

**`UNDECRYPTABLE` is not zero.**
Those rows can't be opened by the new key *or* the old fallback. The migration leaves them
exactly as they are — re-encrypting a value it couldn't decrypt would make the corruption
permanent. It prints each householder id. Investigate before applying; likely plaintext
written before encryption existed, or a value mangled by an earlier partial run.

**`ERROR: Encryption:Key is not set.`**
`.env` is missing or `ENCRYPTION_KEY` is blank. See step 2.

**`ERROR: Encryption:OldKey and Encryption:Key are identical.`**
Nothing to migrate — you've already pointed both at the same value.

**Compose refuses to start after pulling this change.**
Expected. Create `.env` (step 2). This is the `:?` guard doing its job.

**The migration was interrupted.**
Re-run it. Rows already moved report as `already on new key` and are skipped.

---

## Rotating later

Same procedure, one addition: the current key becomes the old one.

```
ENCRYPTION_KEY=<new key>
ENCRYPTION_OLD_KEY=<the key you are replacing>
```

Then steps 0, 3, 4, 5. `ENCRYPTION_OLD_KEY` defaults to the built-in fallback, which is
why the first migration doesn't need it.

---

## Notes

- **The old fallback key is burned.** It's in git history and can't be usefully removed.
  That's fine — after step 4 nothing is protected by it. Don't reuse that string.
- **Losing `ENCRYPTION_KEY` means losing the data.** No key, no recovery. Password manager.
- **Only Nomor KK is encrypted.** Names, phones, emails and addresses are plaintext in the
  database. That may be fine — just know it, and don't assume this migration protects them.
