"use client";

import React, { useState, useRef, useEffect } from "react";
import { AzureOpenAI } from "openai";
import { useTheme } from "next-themes";
import { Send, Settings, Paperclip, Trash2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type SettingsFormValues = {
  azureEndpoint: string;
  azureApiKey: string;
  azureVersion: string;
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}

export default function AzureOpenAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [azureApiKey, setAzureApiKey] = useState("");
  const [azureVersion, setAzureVersion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const form = useForm<SettingsFormValues>({
    defaultValues: {
      azureEndpoint: "",
      azureApiKey: "",
      azureVersion: "",
    },
  });

  useEffect(() => {
    const savedEndpoint = localStorage.getItem("azureEndpoint") || "";
    const savedApiKey = localStorage.getItem("azureApiKey") || "";
    const savedAzureVersion = localStorage.getItem("azureVersion") || "";

    form.reset({
      azureEndpoint: savedEndpoint,
      azureApiKey: savedApiKey,
      azureVersion: savedAzureVersion,
    });

    setAzureEndpoint(savedEndpoint);
    setAzureApiKey(savedApiKey);
    setAzureVersion(savedAzureVersion);
  }, [form]);

  const saveSettings = (data: SettingsFormValues) => {
    localStorage.setItem("azureEndpoint", data.azureEndpoint);
    localStorage.setItem("azureApiKey", data.azureApiKey);
    localStorage.setItem("azureVersion", data.azureVersion);
    setAzureEndpoint(data.azureEndpoint);
    setAzureApiKey(data.azureApiKey);
    setAzureVersion(data.azureVersion);
    alert("Settings saved!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const client = new AzureOpenAI({
        apiKey: azureApiKey,
        baseURL: `${azureEndpoint}`,
        apiVersion: azureVersion,
        dangerouslyAllowBrowser: true,
      });

      const updatedMessages = [...messages, userMessage];

      const response = await client.chat.completions.create({
        model: azureVersion,
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 800,
      });

      if (response.choices && response.choices.length > 0) {
        const assistantMessage: Message = {
          role: "assistant",
          content: response.choices[0].message?.content || "No response",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "An error occurred. Please try again." },
      ]);
    }

    setIsLoading(false);
  };

  const parseMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add the code block
      parts.push({
        type: "code",
        language: match[1] || "plaintext",
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last code block
    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.slice(lastIndex) });
    }

    return parts;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: `[File uploaded: ${file.name}]\n\n${content}`,
          },
        ]);
      };
      reader.readAsText(file);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Azure OpenAI Chat</h1>
        <ThemeToggle />
      </div>
      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Chat
                <Button variant="outline" size="icon" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full pr-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-4 mb-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar>
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {parseMessageContent(message.content).map((part, i) =>
                        part.type === "code" ? (
                          <SyntaxHighlighter
                            key={i}
                            language={part.language}
                            style={vscDarkPlus}
                            customStyle={{
                              margin: "0.5em 0",
                              borderRadius: "4px",
                            }}
                          >
                            {part.content}
                          </SyntaxHighlighter>
                        ) : (
                          <p key={i}>{part.content}</p>
                        ),
                      )}
                    </div>
                    {message.role === "user" && (
                      <Avatar>
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </ScrollArea>
              <form onSubmit={handleSubmit} className="flex items-center mt-4">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-grow mr-2"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="mr-2"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Sending..." : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Azure OpenAI Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(saveSettings)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="azureEndpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Azure Endpoint</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://your-resource-name.openai.azure.com/opeanai/deployments/gpt-4o"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="azureApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Azure API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Your Azure OpenAI API Key"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="azureVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Version</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Azure OpenAI Deployment Version"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    <Settings className="mr-2 h-5 w-5" /> Save Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
