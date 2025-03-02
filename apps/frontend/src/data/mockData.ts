import { QueueStats, Template, Job } from '@/types/queue';

// Generate a large number of mock queues
const generateMockQueues = () => {
  const baseQueues = [
    {
      queueName: "account1",
      running: 5,
      successful: 120,
      failed: 3,
      lastUpdated: new Date()
    },
    {
      queueName: "account2",
      running: 8,
      successful: 95,
      failed: 2,
      lastUpdated: new Date()
    },
    {
      queueName: "account3",
      running: 3,
      successful: 150,
      failed: 1,
      lastUpdated: new Date()
    },
    {
      queueName: "notifications",
      running: 12,
      successful: 230,
      failed: 5,
      lastUpdated: new Date()
    },
    {
      queueName: "emails",
      running: 7,
      successful: 180,
      failed: 2,
      lastUpdated: new Date()
    },
    {
      queueName: "reports",
      running: 2,
      successful: 75,
      failed: 0,
      lastUpdated: new Date()
    }
  ];

  // Generate additional queues
  const additionalQueues: QueueStats[] = [];
  
  // Generate service queues
  for (let i = 1; i <= 20; i++) {
    additionalQueues.push({
      queueName: `service-${i}`,
      running: Math.floor(Math.random() * 10),
      successful: Math.floor(Math.random() * 200) + 50,
      failed: Math.floor(Math.random() * 5),
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 86400000))
    });
  }
  
  // Generate region-based queues
  const regions = ['us', 'eu', 'asia', 'au'];
  regions.forEach(region => {
    for (let i = 1; i <= 15; i++) {
      additionalQueues.push({
        queueName: `${region}-queue-${i}`,
        running: Math.floor(Math.random() * 8),
        successful: Math.floor(Math.random() * 150) + 30,
        failed: Math.floor(Math.random() * 4),
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 86400000))
      });
    }
  });
  
  // Generate customer-specific queues
  for (let i = 1; i <= 30; i++) {
    additionalQueues.push({
      queueName: `customer-${i}`,
      running: Math.floor(Math.random() * 5),
      successful: Math.floor(Math.random() * 100) + 20,
      failed: Math.floor(Math.random() * 3),
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 86400000))
    });
  }

  return [...baseQueues, ...additionalQueues];
};

export const MOCK_QUEUES: QueueStats[] = generateMockQueues();

export const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Welcome Email",
    description: "Template for sending welcome emails to new users",
    createdAt: new Date(2023, 5, 15),
    updatedAt: new Date(2023, 6, 20)
  },
  {
    id: "2",
    name: "Password Reset",
    description: "Template for password reset emails",
    createdAt: new Date(2023, 4, 10),
    updatedAt: new Date(2023, 7, 5)
  },
  {
    id: "3",
    name: "Order Confirmation",
    description: "Template for order confirmation emails",
    createdAt: new Date(2023, 3, 25),
    updatedAt: new Date(2023, 6, 30)
  },
  {
    id: "4",
    name: "Account Verification",
    description: "Template for account verification emails",
    createdAt: new Date(2023, 2, 18),
    updatedAt: new Date(2023, 5, 12)
  }
];

// Generate mock logs for a job
const generateMockLogs = (jobName: string, status: Job['status'], errorMessage?: string) => {
  const logs = [
    `[INFO] Starting job: ${jobName}`,
    `[INFO] Initializing job parameters`,
    `[INFO] Connecting to queue service`,
    `[INFO] Connection established`,
    `[INFO] Starting execution`
  ];
  
  if (status === 'running') {
    logs.push(
      `[INFO] Processing data batch 1/5`,
      `[INFO] Processing data batch 2/5`,
      `[INFO] Processing data batch 3/5`
    );
  } else if (status === 'completed') {
    logs.push(
      `[INFO] Processing data batch 1/5`,
      `[INFO] Processing data batch 2/5`,
      `[INFO] Processing data batch 3/5`,
      `[INFO] Processing data batch 4/5`,
      `[INFO] Processing data batch 5/5`,
      `[INFO] Data processing completed`,
      `[INFO] Finalizing results`,
      `[INFO] Job completed successfully`
    );
  } else if (status === 'failed') {
    logs.push(
      `[INFO] Processing data batch 1/5`,
      `[INFO] Processing data batch 2/5`,
      `[ERROR] Error encountered during processing`,
      `[ERROR] ${errorMessage || 'Unknown error occurred'}`,
      `[INFO] Attempting recovery`,
      `[ERROR] Recovery failed`,
      `[INFO] Job execution failed`
    );
  }
  
  return logs;
};

export const MOCK_JOBS: Job[] = [
  {
    id: "job-1",
    name: "Process User Signup",
    queueName: "account1",
    status: "completed",
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 1.9),
    duration: 5400,
    command: "python3 /scripts/process_signup.py --user-id=12345 --send-welcome=true",
    parameters: {
      "userId": "12345",
      "sendWelcome": true,
      "notifyAdmin": false,
      "source": "web"
    },
    logs: generateMockLogs("Process User Signup", "completed")
  },
  {
    id: "job-2",
    name: "Send Welcome Email",
    queueName: "emails",
    status: "completed",
    createdAt: new Date(Date.now() - 3600000 * 1.5),
    updatedAt: new Date(Date.now() - 3600000 * 1.48),
    duration: 720,
    command: "node /scripts/email_sender.js --template=welcome --recipient=user@example.com",
    parameters: {
      "template": "welcome",
      "recipient": "user@example.com",
      "cc": [],
      "attachments": []
    },
    logs: generateMockLogs("Send Welcome Email", "completed")
  },
  {
    id: "job-3",
    name: "Generate Monthly Report",
    queueName: "reports",
    status: "running",
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 1800000),
    command: "python3 /scripts/generate_report.py --type=monthly --format=pdf",
    parameters: {
      "type": "monthly",
      "format": "pdf",
      "includeCharts": true,
      "recipients": ["admin@example.com", "manager@example.com"]
    },
    logs: generateMockLogs("Generate Monthly Report", "running")
  },
  {
    id: "job-4",
    name: "Process Payment",
    queueName: "account2",
    status: "failed",
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 7190000),
    errorMessage: "Payment gateway timeout",
    command: "node /scripts/payment_processor.js --order-id=ORD-9876 --amount=129.99",
    parameters: {
      "orderId": "ORD-9876",
      "amount": 129.99,
      "currency": "USD",
      "gateway": "stripe"
    },
    logs: generateMockLogs("Process Payment", "failed", "Payment gateway timeout")
  },
  {
    id: "job-5",
    name: "Update User Profile",
    queueName: "account1",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86395000),
    duration: 5000,
    command: "python3 /scripts/update_profile.py --user-id=54321 --fields=email,name,preferences",
    parameters: {
      "userId": "54321",
      "fields": ["email", "name", "preferences"],
      "notifyUser": true
    },
    logs: generateMockLogs("Update User Profile", "completed")
  },
  {
    id: "job-6",
    name: "Send Password Reset",
    queueName: "emails",
    status: "completed",
    createdAt: new Date(Date.now() - 43200000),
    updatedAt: new Date(Date.now() - 43195000),
    duration: 5000,
    command: "node /scripts/email_sender.js --template=password-reset --recipient=user@example.com",
    parameters: {
      "template": "password-reset",
      "recipient": "user@example.com",
      "expiryHours": 24,
      "includeIpInfo": true
    },
    logs: generateMockLogs("Send Password Reset", "completed")
  },
  {
    id: "job-7",
    name: "Process Order #12345",
    queueName: "account3",
    status: "running",
    createdAt: new Date(Date.now() - 900000),
    updatedAt: new Date(Date.now() - 900000),
    command: "python3 /scripts/order_processor.py --order-id=12345 --expedite=true",
    parameters: {
      "orderId": "12345",
      "expedite": true,
      "notifyCustomer": true,
      "warehouse": "east-1"
    },
    logs: generateMockLogs("Process Order #12345", "running")
  },
  {
    id: "job-8",
    name: "Generate Daily Analytics",
    queueName: "reports",
    status: "failed",
    createdAt: new Date(Date.now() - 14400000),
    updatedAt: new Date(Date.now() - 14390000),
    errorMessage: "Database connection error",
    command: "python3 /scripts/analytics.py --period=daily --output=json",
    parameters: {
      "period": "daily",
      "output": "json",
      "metrics": ["users", "revenue", "conversion"],
      "compareWithPrevious": true
    },
    logs: generateMockLogs("Generate Daily Analytics", "failed", "Database connection error")
  },
  {
    id: "job-9",
    name: "Send Notification",
    queueName: "notifications",
    status: "completed",
    createdAt: new Date(Date.now() - 10800000),
    updatedAt: new Date(Date.now() - 10795000),
    duration: 5000,
    command: "node /scripts/notify.js --user-id=8765 --channel=push,email --priority=high",
    parameters: {
      "userId": "8765",
      "channels": ["push", "email"],
      "priority": "high",
      "message": "Your order has shipped!"
    },
    logs: generateMockLogs("Send Notification", "completed")
  },
  {
    id: "job-10",
    name: "Sync User Data",
    queueName: "account2",
    status: "running",
    createdAt: new Date(Date.now() - 600000),
    updatedAt: new Date(Date.now() - 600000),
    command: "python3 /scripts/data_sync.py --source=crm --destination=warehouse --full-sync=false",
    parameters: {
      "source": "crm",
      "destination": "warehouse",
      "fullSync": false,
      "tables": ["users", "orders", "products"]
    },
    logs: generateMockLogs("Sync User Data", "running")
  },
  {
    id: "job-11",
    name: "Process Refund #54321",
    queueName: "account1",
    status: "failed",
    createdAt: new Date(Date.now() - 21600000),
    updatedAt: new Date(Date.now() - 21590000),
    errorMessage: "Invalid transaction ID",
    command: "node /scripts/refund_processor.js --order-id=54321 --amount=79.99 --reason='customer request'",
    parameters: {
      "orderId": "54321",
      "amount": 79.99,
      "reason": "customer request",
      "approvedBy": "agent123"
    },
    logs: generateMockLogs("Process Refund #54321", "failed", "Invalid transaction ID")
  },
  {
    id: "job-12",
    name: "Send Weekly Newsletter",
    queueName: "emails",
    status: "completed",
    createdAt: new Date(Date.now() - 259200000),
    updatedAt: new Date(Date.now() - 259190000),
    duration: 10000,
    command: "node /scripts/newsletter.js --template=weekly --segment=active-users",
    parameters: {
      "template": "weekly",
      "segment": "active-users",
      "includeFeaturedProducts": true,
      "scheduleTime": "2023-06-15T09:00:00Z"
    },
    logs: generateMockLogs("Send Weekly Newsletter", "completed")
  }
];