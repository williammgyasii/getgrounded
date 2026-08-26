FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY GetGrounded.Domain/ GetGrounded.Domain/
COPY GetGrounded.Api/ GetGrounded.Api/
COPY Directory.Build.props Directory.Build.props
RUN dotnet publish GetGrounded.Api/GetGrounded.Api.csproj -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "GetGrounded.Api.dll"]
