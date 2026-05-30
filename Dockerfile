# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY backend/ScoreBridge.Api/ScoreBridge.Api.csproj ./backend/ScoreBridge.Api/
RUN dotnet restore backend/ScoreBridge.Api/ScoreBridge.Api.csproj

# Copy everything else and build
COPY backend/ScoreBridge.Api/ ./backend/ScoreBridge.Api/
WORKDIR /app/backend/ScoreBridge.Api
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build-env /app/backend/ScoreBridge.Api/out .

# Expose ports (Render maps this automatically)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "ScoreBridge.Api.dll"]
