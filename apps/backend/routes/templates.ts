import { type FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../repositories/TemplateRepository";
import { getQueueByName } from "../queue";

// Schema definitions
const templateResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  script: z.string(),
  arguments: z.string().nullable(),
  executionPath: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const templateCreateSchema = z.object({
  name: z.string(),
  script: z.string(),
  action: z.string().optional(),
  executionPath: z.string().optional(),
  arguments: z.string().nullable(),
});

const templateUpdateSchema = templateCreateSchema.partial();

const templateRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /templates - Get all templates
  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      response: {
        200: z.array(templateResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const templates = await getTemplates();
      return templates;
    },
  });

  // GET /templates/:id - Get template by ID
  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
      }),
      response: {
        200: templateResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };
      const template = await getTemplateById(id);

      if (!template) {
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      return template;
    },
  });

  // POST /templates - Create a new template
  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      body: templateCreateSchema,
      response: {
        201: templateResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const template = await createTemplate(request.body as any);
      reply.code(201);
      return template;
    },
  });

  // PUT /templates/:id - Update an existing template
  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
      }),
      body: templateUpdateSchema,
      response: {
        200: templateResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };
      const existingTemplate = await getTemplateById(id);

      if (!existingTemplate) {
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      const updatedTemplate = await updateTemplate(id, request.body as any);
      return updatedTemplate;
    },
  });

  // DELETE /templates/:id - Delete a template
  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };
      const success = await deleteTemplate(id);

      if (!success) {
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      return {
        success: true,
        message: `Template with id ${id} deleted successfully`,
      };
    },
  });

  // POST /templates/run - Run a template by ID
  fastify.route({
    method: "POST",
    url: "/run",
    schema: {
      body: z.object({
        id: z.number(),
        queueName: z.string(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          jobId: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id, queueName } = request.body as {
        id: number;
        queueName: string;
      };
      const template = await getTemplateById(id);

      if (!template) {
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      const queue = getQueueByName(queueName);

      if (!queue) {
        reply.code(404);
        return { message: `Queue ${queueName} not found` };
      }

      const formattedTime = Date.now();
      console.log(template);
      const job = await queue.add(`👤 ${queueName} ⏱️ ${formattedTime}`, {
        script: template.script,
        arguments: template.arguments,
        executionPath: template.executionPath,
      });

      return {
        success: true,
        jobId: job.id,
      };
    },
  });
};

export default templateRoutes;
