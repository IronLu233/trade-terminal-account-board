import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Account {
  _id: string;
  account: string;
}

// API endpoint base path
const ACCOUNT_API = '/api/v2/account';

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API错误: ${response.status}`);
  }
  return response.json();
};

// 获取所有账户
export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<{ accounts: Account[] }> => {
      const response = await fetch(ACCOUNT_API);
      return handleApiResponse(response);
    },
    staleTime: 30000, // 30秒内不重新获取数据
  });
};

// 获取单个账户
export const useAccount = (id: string) => {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async (): Promise<Account> => {
      const response = await fetch(`${ACCOUNT_API}/${id}`);
      return handleApiResponse(response);
    },
    enabled: !!id, // 只有当id存在时才执行查询
  });
};

// 创建新账户
export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { account: string }): Promise<Account> => {
      const response = await fetch(ACCOUNT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleApiResponse(response);
    },
    onSuccess: () => {
      // 创建成功后刷新账户列表
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

// 更新账户
export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { account: string } }): Promise<Account> => {
      const response = await fetch(`${ACCOUNT_API}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleApiResponse(response);
    },
    onSuccess: (_, variables) => {
      // 更新成功后刷新账户列表和单个账户详情
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
    },
  });
};

// 删除账户
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; message: string }> => {
      const response = await fetch(`${ACCOUNT_API}/${id}`, {
        method: 'DELETE',
      });
      return handleApiResponse(response);
    },
    onSuccess: () => {
      // 删除成功后刷新账户列表
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
