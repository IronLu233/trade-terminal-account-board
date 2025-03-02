import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QueueStats } from "@/types/queue";

interface QueueComboboxProps {
  queues: QueueStats[];
  value: string;
  onChange: (value: string) => void;
}

export default function QueueCombobox({ queues, value, onChange }: QueueComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQueues, setFilteredQueues] = useState<QueueStats[]>(queues);

  // Group queues by type for better organization
  const groupQueues = useCallback(() => {
    const groups: Record<string, QueueStats[]> = {
      "Main Queues": [],
      "Service Queues": [],
      "Regional Queues": [],
      "Customer Queues": [],
      "Other Queues": [],
    };

    queues.forEach(queue => {
      const name = queue.queueName;
      if (name.startsWith("service-")) {
        groups["Service Queues"].push(queue);
      } else if (name.startsWith("us-") || name.startsWith("eu-") || name.startsWith("asia-") || name.startsWith("au-")) {
        groups["Regional Queues"].push(queue);
      } else if (name.startsWith("customer-")) {
        groups["Customer Queues"].push(queue);
      } else if (["account1", "account2", "account3", "notifications", "emails", "reports"].includes(name)) {
        groups["Main Queues"].push(queue);
      } else {
        groups["Other Queues"].push(queue);
      }
    });

    return groups;
  }, [queues]);

  // Filter queues based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredQueues(queues);
      return;
    }

    const filtered = queues.filter(queue =>
      queue.queueName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQueues(filtered);
  }, [searchTerm, queues]);

  // Get the selected queue name for display
  const getSelectedQueueName = () => {
    if (value === "all") return "All Queues";
    return value;
  };

  const queueGroups = groupQueues();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between md:w-[300px] lg:w-[400px]"
        >
          {getSelectedQueueName()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 md:w-[300px] lg:w-[400px]">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search queues..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No queue found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                All Queues
              </CommandItem>
            </CommandGroup>

            {Object.entries(queueGroups).map(([groupName, groupQueues]) => {
              // Only show groups that have queues matching the search term
              const matchingQueues = groupQueues.filter(queue =>
                queue.queueName.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (matchingQueues.length === 0) return null;

              return (
                <CommandGroup key={groupName} heading={groupName}>
                  {matchingQueues.map(queue => (
                    <CommandItem
                      key={queue.queueName}
                      value={queue.queueName}
                      onSelect={() => {
                        onChange(queue.queueName);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === queue.queueName ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {queue.queueName}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {queue.running} running
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
