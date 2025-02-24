import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { Queue as QueueMQ, Worker, type RedisOptions } from 'bullmq';
import fastify from 'fastify';

const sleep = (t: number) => new Promise((resolve) => setTimeout(resolve, t * 1000));



const redisOptions: RedisOptions = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost',
  password: process.env.REDIS_PASS || '',
};

const createQueueMQ = (name: string) => new QueueMQ(name, { connection: redisOptions });

function setupBullMQProcessor(queueName: string) {
  new Worker(
    queueName,
    async (job) => {
      for (let i = 0; i <= 100; i++) {
        await sleep(1000);
        await job.updateProgress(i);
        await job.log(`Processing job at interval ${i}`);

        if (Math.random() * 200 < 1) throw new Error(`Random error ${i}`);
      }

      return { jobId: `This is the return value of job (${job.id})` };
    },
    { connection: redisOptions }
  );
}

function readQueuesFromEnv() {
  const qStr = process.env.BULL_QUEUE_NAMES_CSV || 'Example';
  try {
    const qs = qStr.split(',');
    return qs.map((q) => q.trim());
  } catch (e) {
    return [];
  }
}

const run = async () => {
  const queues = readQueuesFromEnv().map((q) => createQueueMQ(q));

  queues.forEach((q) => {
    setupBullMQProcessor(q.name);
  });

  const app = fastify();

  const serverAdapter = new FastifyAdapter();

  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter,
    // options: {
    //     uiBasePath: '/ui',
    //     uiConfig: {}
    // }
  });

  serverAdapter.setBasePath('/ui');
  app.register(serverAdapter.registerPlugin(), { prefix: '/ui', basePath: '/' });

  app.get('/add', (req: any, reply) => {
    const opts = req.query.opts || {};

    if (opts.delay) {
      opts.delay = +opts.delay * 1000; // delay must be a number
    }

    queues.forEach((queue) => queue.add('Add', { title: req.query.title }, opts));

    reply.send({
      ok: true,
    });
  });

  const port = 3000;
  await app.listen({ host: '0.0.0.0', port });
  // eslint-disable-next-line no-console
  console.log(`For the UI, open http://localhost:${port}/ui`);
  console.log('Make sure Redis is configured in env variables. See .env.example');
  console.log('To populate the queue, run:');
  console.log(`  curl http://localhost:${port}/add?title=Example`);
  console.log('To populate the queue with custom options (opts), run:');
  console.log(`  curl http://localhost:${port}/add?title=Test&opts[delay]=9`);
  console.log(`*** If you launched from docker-compose use port 3333 instead of 3000 ***`);
};

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
