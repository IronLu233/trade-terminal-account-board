import { type FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { getQueueByName } from "../services/queue";
import { logger } from "common"; // Import the logger
import mongoose from 'mongoose';


const templateEntitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  script: { type: String, required: true },
  arguments: { type: String, default: null },
  executionPath: { type: String, default: null },
}, {
  timestamps: true // 这会自动添加 createdAt 和 updatedAt 字段
});

// 添加虚拟字段 id 来匹配 responseSchema
templateEntitySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// 确保虚拟字段在 JSON 输出中包含
templateEntitySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const TemplateModel = mongoose.model('Template', templateEntitySchema);

// 公共方法：格式化模板数据以匹配 responseSchema
const formatTemplate = (template: any): z.infer<typeof templateResponseSchema> => {
  return {
    id: template._id.toString(),
    name: template.name,
    script: template.script,
    arguments: template.arguments,
    executionPath: template.executionPath,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
};

// Schema definitions
const templateResponseSchema = z.object({
  id: z.string(),
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
      const templates = await TemplateModel.find({})
        .sort({ createdAt: -1 })
        .lean();

      // 转换数据格式以匹配 schema
      const formattedTemplates = templates.map(formatTemplate);

      logger.debug(`Retrieved ${formattedTemplates.length} templates`);
      return formattedTemplates;
    },
  });

  // GET /templates/:id - Get template by ID
  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: templateResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      logger.debug(`Retrieving template with id: ${id}`);
      const template = await TemplateModel.findById(id).lean();

      if (!template) {
        logger.warn(`Template with id ${id} not found`);
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      // 转换数据格式以匹配 schema
      const formattedTemplate = formatTemplate(template);

      logger.debug(`Retrieved template: ${template.name}`);
      return formattedTemplate;
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
      const template = new TemplateModel({
        name: templateData.name,
        script: templateData.script,
        arguments: templateData.arguments || null,
        executionPath: templateData.executionPath || null
      });
      const savedTemplate = await template.save();
      logger.info(`Template created successfully with id: ${savedTemplate.id}`);
      reply.code(201);

      // 转换数据格式以匹配 schema
      return formatTemplate(savedTemplate.toObject());
    },
  });

  // PUT /templates/:id - Update an existing template
  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      params: z.object({
        id: z.string(),
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
      const { id } = request.params as { id: string };
      const updateData = request.body as any;
      logger.info(`Updating template with id: ${id}`);

      const updatedTemplate = await TemplateModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).lean();

      if (!updatedTemplate) {
        logger.warn(`Update failed: Template with id ${id} not found`);
        reply.code(404);
        return { message: `Template with id ${id} not found` };
      }

      // 转换数据格式以匹配 schema
      const formattedTemplate = formatTemplate(updatedTemplate);

      logger.info(`Template id ${id} updated successfully`);
      logger.debug(`Updated fields: ${Object.keys(updateData).join(", ")}`);
      return formattedTemplate;
    },
  });

  // DELETE /templates/:id - Delete a template
  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      params: z.object({
        id: z.string(),
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
      const { id } = request.params as { id: string };
      logger.info(`Deleting template with id: ${id}`);

      const deletedTemplate = await TemplateModel.findByIdAndDelete(id);

      if (!deletedTemplate) {
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
        id: z.string(),
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
        id: string;
        queueName: string;
      };
      logger.info(`Executing template id ${id} on queue ${queueName}`);
      const template = await TemplateModel.findById(id).lean();

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
          keepLogs: 10000,
          removeOnComplete: {
            age: 3600 * 24,
          },
          removeOnFail: {
            age: 3600 * 24 * 2,
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
