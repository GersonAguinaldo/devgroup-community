import { Link } from "react-router-dom";
import { ChevronUp, MessageSquare, Eye, Bookmark } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import type { QuestionRow } from "@/hooks/useData";

const QuestionCard = ({ question, hasAccepted = false }: { question: QuestionRow; hasAccepted?: boolean }) => {
  return (
    <Link
      to={`/question/${question.id}`}
      className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-card/80 animate-fade-in"
    >
      <div className="flex gap-4">
        <div className="hidden sm:flex flex-col items-center gap-2 shrink-0 text-center min-w-[60px]">
          <div className="flex flex-col items-center">
            <ChevronUp className="h-4 w-4 text-vote-up" />
            <span className="text-lg font-bold font-mono text-foreground">{question.votes}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">votes</span>
          </div>
          <div
            className={`flex flex-col items-center rounded-md px-2 py-1 ${
              hasAccepted
                ? "bg-primary/15 text-primary"
                : question.answers_count > 0
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-sm font-bold font-mono">{question.answers_count}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex sm:hidden items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1 font-mono">
              <ChevronUp className="h-3 w-3 text-vote-up" />
              {question.votes}
            </span>
            <span className={`flex items-center gap-1 font-mono ${hasAccepted ? "text-primary" : ""}`}>
              <MessageSquare className="h-3 w-3" />
              {question.answers_count}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Eye className="h-3 w-3" />
              {question.views}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {question.post_type === "news" && (
              <span className="mr-2 inline-block rounded-sm bg-primary/15 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary align-middle">
                News
              </span>
            )}
            {question.post_type === "discussion" && (
              <span className="mr-2 inline-block rounded-sm bg-accent/15 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-accent align-middle">
                Discussion
              </span>
            )}
            {question.title}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
            {question.body.replace(/```[\s\S]*?```/g, "[code]").replace(/`[^`]+`/g, "[code]").slice(0, 150)}...
          </p>

          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {question.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-sm bg-tag px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-mono font-medium text-tag-foreground"
              >
                {tag}
              </span>
            ))}
            {question.tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{question.tags.length - 4}</span>
            )}
            <div className="ml-auto hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {question.views}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                {question.bookmarks}
              </span>
              <Link
                to={`/user/${question.author_id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                  {question.author_avatar}
                </span>
                {question.author_username}
              </Link>
              <span>{timeAgo(question.created_at)}</span>
            </div>
          </div>

          <div className="flex sm:hidden items-center gap-2 mt-2 text-[10px] text-muted-foreground">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-secondary-foreground">
              {question.author_avatar}
            </span>
            <span>{question.author_username}</span>
            <span>· {timeAgo(question.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default QuestionCard;
