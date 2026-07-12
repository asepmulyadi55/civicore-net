# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CiviCore.Api/CiviCore.Api.csproj", "CiviCore.Api/"]
COPY ["CiviCore.Application/CiviCore.Application.csproj", "CiviCore.Application/"]
COPY ["CiviCore.Domain/CiviCore.Domain.csproj", "CiviCore.Domain/"]
COPY ["CiviCore.Infrastructure/CiviCore.Infrastructure.csproj", "CiviCore.Infrastructure/"]
RUN dotnet restore "CiviCore.Api/CiviCore.Api.csproj"
COPY . .
WORKDIR "/src/CiviCore.Api"
RUN dotnet publish "CiviCore.Api.csproj" -c Release -o /app/publish

# Serve stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# BEST PRACTICE: Create required directories and give the non-root 'app' user ownership
RUN mkdir -p /app/DataProtection-Keys /app/wwwroot/public-media /app/App_Data/PrivateMedia \
    && chown -R app:app /app/DataProtection-Keys /app/wwwroot /app/App_Data

USER app
ENTRYPOINT ["dotnet", "CiviCore.Api.dll"]
