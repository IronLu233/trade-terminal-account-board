# Bull Dashboard Common

This package contains common utilities, types, and shared code for the Bull Dashboard ecosystem.

## Overview

The common package provides shared functionality used across the Bull Dashboard packages, including:

- Common TypeScript interfaces and types
- Shared utility functions
- Logging functionality

## Installation

```bash
npm install @bull-dashboard/common
```

## Usage

### Importing Types

```typescript
import { YourType } from "@bull-dashboard/common";
```

### Using the Logger

```typescript
import { logger } from "@bull-dashboard/common";

logger.info("This is an informational message");
logger.error("An error occurred", error);
```

## API Reference

### Types

The package exports various TypeScript interfaces and types used throughout the Bull Dashboard ecosystem.

### Logger

A shared logging utility with the following methods:

- `info(message: string, ...args: any[])`
- `warn(message: string, ...args: any[])`
- `error(message: string, ...args: any[])`
- `debug(message: string, ...args: any[])`
