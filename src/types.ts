export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface CapabilityCard {
  id: string;
  title: string;
  description: string;
  iconName: string;
  prompts: string[];
  colorTheme: {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    hoverBg: string;
  };
}
