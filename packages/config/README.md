# Bull Dashboard Config

This package provides configuration utilities for the Bull Dashboard application.

## Features

- Configuration management with YAML support
- Redis connection management
- Environment variable handling
- Inter-process communication channels

## Installation

To install dependencies:

```bash
bun install
```

## Usage

### Basic Usage

```typescript
import { configDb, redisOptions, RedisChannel } from "@bull-dashboard/config";

// Access configuration from YAML file
const config = configDb.data;

// Use Redis connection options
const redisClient = createClient(redisOptions);

// Use predefined channels for communication
publishMessage(RedisChannel.CreateWorker, workerData);
```

### Available Exports

- `Config` - Type definition for configuration structure
- `configDb` - LowDB database instance for configuration management
- `redisOptions` - Redis connection configuration
- `RedisChannel` - Enum of available communication channels
