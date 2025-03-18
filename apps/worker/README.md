# Worker App

A BullMQ-based worker service for processing background jobs.

## Overview

This worker application is designed to process jobs from BullMQ queues. It spawns Python processes based on job configurations and handles their execution, logging, and error reporting.

## Features

- Dynamically creates workers for multiple queues
- Executes Python scripts using pipenv
- Captures and logs output from scripts
- Reports job statuses back to BullMQ
- Handles job completion and failures
- Supports dynamic worker creation via Redis pub/sub

## Installation

To install dependencies:

```bash
bun install
```

## Configuration

The worker relies on configuration from:

- Redis connection settings
- Configuration database
- Environment variables (particularly `SCRIPT_PWD`)

## Usage

### Starting the Worker

```bash
bun run index.ts
```

### Job Payload Structure

Jobs should have the following structure:

```typescript
{
  script: string;        // Path to Python script
  arguments?: string;    // Optional command-line arguments
  executionPath?: string; // Optional custom execution path
}
```

### Creating New Workers

New workers can be dynamically created by publishing to the Redis channel for worker creation with a queue name.

## Development

This project was created using `bun init` in bun v1.2.3. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Logs

The worker logs all job activities, including:

- Job start and completion
- Standard output and errors from scripts
- Process information

## Concurrency

By default, each worker processes up to 10 jobs concurrently.
