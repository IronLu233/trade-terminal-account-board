import { type FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../repositories/TemplateRepository";
import { getQueueByName } from "../services/queue";
import logger from "../utils/logger"; // Import the logger

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
      logger.debug("Retrieving all templates");
      const templates = await getTemplates();
      logger.debug(`Retrieved ${templates.length} templates`);
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
      logger.debug(`Retrieving template with id: ${id}`);
      const template = await getTemplateById(id);

      if (!template) {
        logger.warn(`Template with id ${id} not found`);
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      logger.debug(`Retrieved template: ${template.name}`);
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
      const templateData = request.body as any;
      logger.info(`Creating new template: ${templateData.name}`);
      const template = await createTemplate(templateData);
      logger.info(`Template created successfully with id: ${template.id}`);
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
      const updateData = request.body as any;
      logger.info(`Updating template with id: ${id}`);
      const existingTemplate = await getTemplateById(id);

      if (!existingTemplate) {
        logger.warn(`Update failed: Template with id ${id} not found`);
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      const updatedTemplate = await updateTemplate(id, updateData);
      logger.info(`Template id ${id} updated successfully`);
      logger.debug(`Updated fields: ${Object.keys(updateData).join(", ")}`);
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
      logger.info(`Deleting template with id: ${id}`);
      const success = await deleteTemplate(id);

      if (!success) {
        logger.warn(`Deletion failed: Template with id ${id} not found`);
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      logger.info(`Template id ${id} deleted successfully`);
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
      logger.info(`Executing template id ${id} on queue ${queueName}`);
      const template = await getTemplateById(id);

      if (!template) {
        logger.warn(`Execution failed: Template with id ${id} not found`);
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      const queue = getQueueByName(queueName);

      if (!queue) {
        logger.warn(`Execution failed: Queue ${queueName} not found`);
        reply.code(404);
        return { message: `Queue ${queueName} not found` };
      }

      const formattedTime = Date.now();
      logger.debug(
        `Template details: ${JSON.stringify({
          name: template.name,
          executionPath: template.executionPath,
          hasArguments: !!template.arguments,
        })}`
      );
      const job = await queue.add(
        `👤 ${queueName} ⏱️ ${formattedTime}`,
        {
          script: template.script,
          arguments: template.arguments,
          executionPath: template.executionPath,
          templateName: template.name,
        },
        {
          removeOnComplete: {
            age: 3600 * 24 * 7,
          },
          removeOnFail: {
            age: 3600 * 24 * 7,
          },
        }
      );

      logger.info(
        `Template ${id} executed successfully, job created with id: ${job.id}`
      );
      return {
        success: true,
        jobId: job.id,
      };
    },
  });
};

export default templateRoutes;
