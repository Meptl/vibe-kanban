# Setup Node Pnpm Cache Ordering

This section documents CI setup ordering that prevents pnpm cache checks from running before pnpm is installed.

The workflow disables premature package-manager cache probing during Node setup, then performs pnpm-specific cache steps only after pnpm installation succeeds.
