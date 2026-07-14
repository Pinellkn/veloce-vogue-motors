import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getConversationThread,
  listConversations,
  sendMessage,
} from "@/backend/functions/dashboard";
import { formatDateTime, formatPrice } from "@/lib/car-images";

export const Route = createFileRoute("/dashboard/messages")({
  loader: () => listConversations(),
  component: MessagesPage,
});

function MessagesPage() {
  const conversations = Route.useLoaderData();
  const router = useRouter();
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? null);
  const [thread, setThread] = useState<Awaited<ReturnType<typeof getConversationThread>> | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeId) {
      setThread(null);
      return;
    }
    let cancelled = false;
    getConversationThread({ data: { conversationId: activeId } }).then((data) => {
      if (!cancelled) setThread(data);
    });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessage({ data: { conversationId: activeId, body: draft.trim() } });
      setDraft("");
      const updated = await getConversationThread({ data: { conversationId: activeId } });
      setThread(updated);
      await router.invalidate();
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
            Messagerie directe
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Messages.</h1>
        </div>
        <div className="bg-white rounded-2xl ring-1 ring-hairline p-12 text-center text-sm text-muted-foreground">
          Aucune conversation pour le moment.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
          Messagerie directe
        </p>
        <h1 className="font-serif text-4xl md:text-5xl italic">Messages.</h1>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-hairline overflow-hidden grid md:grid-cols-[280px_1fr] h-[600px]">
        <aside className="border-r border-hairline overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-4 border-b border-hairline transition-colors ${
                activeId === c.id ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatDateTime(c.time)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">{c.last}</p>
                {c.unread > 0 && (
                  <span className="ml-2 shrink-0 size-5 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </aside>

        <div className="flex flex-col">
          <div className="p-5 border-b border-hairline">
            <p className="font-medium">{thread?.sellerName ?? "—"}</p>
            {thread?.carName && (
              <p className="text-xs text-muted-foreground">
                {thread.carName} · {thread.carPrice ? formatPrice(thread.carPrice) : ""}
              </p>
            )}
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {thread?.messages.map((m, i) => (
              <div key={i} className={`max-w-[75%] ${m.from === "me" ? "ml-auto" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === "me"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
                <p
                  className={`text-[10px] text-muted-foreground mt-1 ${
                    m.from === "me" ? "text-right" : ""
                  }`}
                >
                  {formatDateTime(m.time)}
                </p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-4 border-t border-hairline flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Écrire un message…"
              className="flex-1 text-sm py-2.5 px-4 bg-muted rounded-full outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="size-10 grid place-items-center bg-primary text-primary-foreground rounded-full disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
