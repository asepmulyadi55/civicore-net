$ErrorActionPreference = "Stop"
dotnet new sln -n CiviCore
dotnet new webapi -n CiviCore.Api --use-controllers
dotnet new classlib -n CiviCore.Core
dotnet new xunit -n CiviCore.Tests

dotnet sln add CiviCore.Api/CiviCore.Api.csproj
dotnet sln add CiviCore.Core/CiviCore.Core.csproj
dotnet sln add CiviCore.Tests/CiviCore.Tests.csproj

dotnet add CiviCore.Api/CiviCore.Api.csproj reference CiviCore.Core/CiviCore.Core.csproj
dotnet add CiviCore.Tests/CiviCore.Tests.csproj reference CiviCore.Api/CiviCore.Api.csproj

dotnet add CiviCore.Api/CiviCore.Api.csproj package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add CiviCore.Api/CiviCore.Api.csproj package Microsoft.EntityFrameworkCore.Design
dotnet add CiviCore.Api/CiviCore.Api.csproj package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add CiviCore.Api/CiviCore.Api.csproj package supabase-csharp
dotnet add CiviCore.Api/CiviCore.Api.csproj package AutoMapper.Extensions.Microsoft.DependencyInjection
dotnet add CiviCore.Api/CiviCore.Api.csproj package Serilog.AspNetCore
dotnet add CiviCore.Api/CiviCore.Api.csproj package Serilog.Sinks.PostgreSQL
dotnet add CiviCore.Api/CiviCore.Api.csproj package ClosedXML
dotnet add CiviCore.Api/CiviCore.Api.csproj package Swashbuckle.AspNetCore
dotnet add CiviCore.Api/CiviCore.Api.csproj package Otp.NET
dotnet add CiviCore.Api/CiviCore.Api.csproj package QRCoder
dotnet add CiviCore.Api/CiviCore.Api.csproj package Microsoft.AspNetCore.Authentication.Google
dotnet add CiviCore.Api/CiviCore.Api.csproj package MailKit

Write-Host "Initialization complete."
