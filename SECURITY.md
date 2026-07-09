# Security Policy

## Supported versions

Security fixes are provided for the latest published major version. Users
should upgrade to the latest available release before reporting an issue.

## Reporting a vulnerability

Please use GitHub private vulnerability reporting for this repository:

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability**.
3. Include affected versions, reproduction steps, impact, and any suggested
   mitigation.

If private reporting is unavailable, contact the maintainer using the address
listed in `package.json`. Do not include active API tokens, customer data, or
other secrets in the report.

Please allow reasonable time for investigation and remediation before public
disclosure.

## Deployment guidance

- Prefer `BUSINESSMAP_READ_ONLY_MODE=true` unless write operations are required.
- Use a dedicated BusinessMap token with the minimum necessary permissions.
- Never commit tokens or `.env` files.
- Rotate a token immediately if it may have been exposed.
- Treat the HTTP transport as an internal service unless authentication,
  authorization, TLS, and rate limiting are configured.
- Restrict `ALLOWED_ORIGINS` and `ALLOWED_HOSTS` to known clients.
- Keep the package and container image updated.

The built-in read-only mode and network allowlists are defense-in-depth
controls; they do not replace authentication for remotely accessible servers.
