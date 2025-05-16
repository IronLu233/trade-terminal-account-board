import { type FastifyPluginAsync } from "fastify";
import { configDb, RedisChannel } from "config";
import { z } from "zod";
import { redisChannel } from "../services/redis";
import { removeAccountQueue, setupSingleAccountQueue } from "../services/queue";

const accountSchema = z.object({
  account: z.string().min(1, "账户名不能为空"),
});

const accountRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取所有账户
  fastify.route({
    method: "GET",
    url: "/",
    schema: {

    },
    handler: async (request, reply) => {
      const accounts = await configDb.AccountModel.find();
      return { accounts: accounts.map(it => it.toJSON()) };
    },
  });

  // 创建新账户
  fastify.route({
    method: "POST",
    url: "/",
    schema: {
    },
    handler: async (request, reply) => {
      try {
        const accountData = request.body as { account: string };

        // 检查账户是否已存在
        const existingAccount = await configDb.AccountModel.findOne({ account: accountData.account });
        if (existingAccount) {
          reply.code(400);
          return { message: `账户 ${accountData.account} 已存在` };
        }

        const newAccount = new configDb.AccountModel(accountData);
        await newAccount.save();
        await setupSingleAccountQueue(accountData.account)

        // 通过Redis通知worker创建新账户
        await redisChannel.publish(
          RedisChannel.CreateAccount,
          JSON.stringify({ account: accountData.account })
        );

        reply.code(201);
        return newAccount.toJSON();
      } catch (error) {
        reply.code(400);
        return { message: (error as Error).message };
      }
    },
  });

  // 更新账户
  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: accountSchema,
      response: {
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const updateData = request.body as { account: string };

      try {
        // 检查要更新的账户是否存在
        const existingAccount = await configDb.AccountModel.findById(id);
        if (!existingAccount) {
          reply.code(404);
          return { message: `账户ID ${id} 不存在` };
        }

        // 检查新账户名是否已被其他记录使用
        if (updateData.account !== existingAccount.account) {
          const duplicateAccount = await configDb.AccountModel.findOne({
            account: updateData.account,
            _id: { $ne: id }
          });

          if (duplicateAccount) {
            reply.code(400);
            return { message: `账户名 ${updateData.account} 已被使用` };
          }
        }

        // 更新账户
        const updatedAccount = await configDb.AccountModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        );

        return updatedAccount?.toJSON();
      } catch (error) {
        reply.code(400);
        return { message: (error as Error).message };
      }
    },
  });

  // 删除账户
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

      try {
        const result = await configDb.AccountModel.findById(id);

        if (!result) {
          reply.code(404);
          return { message: `账户ID ${id} 不存在` };
        }
        const account = result.account;
        removeAccountQueue(account)
        await result.deleteOne();

        // 通过Redis通知worker删除账户
        await redisChannel.publish(
          RedisChannel.RemoveAccount,
          JSON.stringify({ account: account })
        );

        return {
          success: true,
          message: `账户 ${account} 已成功删除`,
        };
      } catch (error) {
        reply.code(400);
        return { message: (error as Error).message };
      }
    },
  });
};

export default accountRoutes;
