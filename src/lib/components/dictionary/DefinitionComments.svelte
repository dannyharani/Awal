<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import * as Avatar from '$lib/components/ui/avatar';
  import { MessageSquare, CornerDownRight, Trash2, Send } from '@lucide/svelte';

  interface CommentAuthor {
    username: string | null;
    avatar_url: string | null;
    role?: string | null;
  }

  interface CommentItem {
    id: number;
    definition_id: number;
    user_id: string;
    parent_id: number | null;
    content: string;
    created_at: string;
    author?: CommentAuthor | null;
  }

  interface Props {
    definitionId: number;
    comments: CommentItem[];
    user: { id: string } | null;
    role?: string | null;
  }

  let { definitionId, comments = [], user, role = 'user' }: Props = $props();

  let newComment = $state('');
  let replyToId = $state<number | null>(null);
  let replyContent = $state('');
  let isSubmitting = $state(false);

  let topLevelComments = $derived(comments.filter((c) => !c.parent_id));
  let repliesByParent = $derived.by(() => {
    const map: Record<number, CommentItem[]> = {};
    for (const c of comments) {
      if (c.parent_id) {
        if (!map[c.parent_id]) map[c.parent_id] = [];
        map[c.parent_id].push(c);
      }
    }
    return map;
  });

  function canDelete(commentUserId: string) {
    if (!user) return false;
    return user.id === commentUserId || role === 'admin' || role === 'moderator';
  }

  function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
</script>

<div class="border-border/60 bg-background/60 w-full space-y-4 border-t px-4 py-4 sm:px-6">
  <div class="flex items-center justify-between">
    <h4 class="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
      <MessageSquare class="h-3.5 w-3.5" />
      Community Discussion ({comments.length})
    </h4>
  </div>

  {#if topLevelComments.length === 0}
    <p class="text-muted-foreground py-2 text-xs italic">
      No comments yet. Share regional context, etymology notes, or usage nuances!
    </p>
  {:else}
    <div class="space-y-3">
      {#each topLevelComments as comment (comment.id)}
        <div class="bg-card/80 border-border/50 space-y-2 rounded-lg border p-3 text-sm">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Avatar.Root class="h-5 w-5 border">
                <Avatar.Image src={comment.author?.avatar_url ?? undefined} />
                <Avatar.Fallback class="text-[9px]">
                  {comment.author?.username?.slice(0, 2).toUpperCase() ?? 'U'}
                </Avatar.Fallback>
              </Avatar.Root>
              {#if comment.author?.username}
                <a
                  href="/user/{comment.author.username}"
                  class="text-foreground hover:text-primary text-xs font-semibold hover:underline"
                >
                  {comment.author.username}
                </a>
              {:else}
                <span class="text-muted-foreground text-xs font-medium">Anonymous</span>
              {/if}

              {#if comment.author?.role && comment.author.role !== 'user'}
                <Badge variant="secondary" class="h-4 px-1.5 text-[9px] capitalize">
                  {comment.author.role}
                </Badge>
              {/if}

              <span class="text-muted-foreground text-[10px]">
                • {formatRelativeDate(comment.created_at)}
              </span>
            </div>

            <div class="flex items-center gap-1">
              {#if user}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground hover:text-foreground h-6 px-2 text-[11px]"
                  onclick={() => {
                    replyToId = replyToId === comment.id ? null : comment.id;
                    replyContent = '';
                  }}
                >
                  Reply
                </Button>
              {/if}

              {#if canDelete(comment.user_id)}
                <form method="POST" action="?/deleteComment" use:enhance>
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:text-destructive h-6 w-6"
                    title="Delete comment"
                  >
                    <Trash2 class="h-3 w-3" />
                  </Button>
                </form>
              {/if}
            </div>
          </div>

          <p class="text-foreground/90 pl-7 text-xs leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          <!-- Replies -->
          {#if repliesByParent[comment.id]?.length}
            <div class="border-border/60 mt-2 ml-5 space-y-2 border-l-2 pl-3">
              {#each repliesByParent[comment.id] as reply (reply.id)}
                <div class="bg-muted/30 rounded-md p-2 text-xs">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5">
                      <CornerDownRight class="text-muted-foreground h-3 w-3" />
                      {#if reply.author?.username}
                        <a
                          href="/user/{reply.author.username}"
                          class="text-foreground hover:text-primary font-semibold hover:underline"
                        >
                          {reply.author.username}
                        </a>
                      {:else}
                        <span class="text-muted-foreground font-medium">Anonymous</span>
                      {/if}
                      {#if reply.author?.role && reply.author.role !== 'user'}
                        <Badge variant="secondary" class="h-3.5 px-1 text-[8px] capitalize">
                          {reply.author.role}
                        </Badge>
                      {/if}
                      <span class="text-muted-foreground text-[10px]">
                        • {formatRelativeDate(reply.created_at)}
                      </span>
                    </div>

                    {#if canDelete(reply.user_id)}
                      <form method="POST" action="?/deleteComment" use:enhance>
                        <input type="hidden" name="comment_id" value={reply.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          class="text-muted-foreground hover:text-destructive h-5 w-5"
                          title="Delete reply"
                        >
                          <Trash2 class="h-2.5 w-2.5" />
                        </Button>
                      </form>
                    {/if}
                  </div>
                  <p class="text-foreground/90 mt-1 pl-4 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Inline Reply Form -->
          {#if replyToId === comment.id && user}
            <form
              method="POST"
              action="?/addComment"
              use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                  isSubmitting = false;
                  replyContent = '';
                  replyToId = null;
                  await update();
                };
              }}
              class="mt-2 ml-5 flex items-center gap-2 pt-1"
            >
              <input type="hidden" name="definition_id" value={definitionId} />
              <input type="hidden" name="parent_id" value={comment.id} />
              <Input
                name="content"
                bind:value={replyContent}
                placeholder={`Reply to ${comment.author?.username ?? 'comment'}...`}
                class="h-8 text-xs"
                required
              />
              <Button
                type="submit"
                size="sm"
                class="h-8 gap-1 px-3 text-xs"
                disabled={isSubmitting || !replyContent.trim()}
              >
                <Send class="h-3 w-3" />
                Reply
              </Button>
            </form>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if user}
    <form
      method="POST"
      action="?/addComment"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          isSubmitting = false;
          newComment = '';
          await update();
        };
      }}
      class="flex items-center gap-2 pt-1"
    >
      <input type="hidden" name="definition_id" value={definitionId} />
      <Input
        name="content"
        bind:value={newComment}
        placeholder="Add a note on dialect, grammar, or usage..."
        class="h-9 text-xs"
        required
      />
      <Button
        type="submit"
        size="sm"
        class="h-9 gap-1.5 px-3 text-xs"
        disabled={isSubmitting || !newComment.trim()}
      >
        <Send class="h-3.5 w-3.5" />
        Post
      </Button>
    </form>
  {:else}
    <p class="text-muted-foreground text-xs">
      <a href="/login" class="text-primary font-medium hover:underline">Sign in</a> to join the linguistic
      discussion.
    </p>
  {/if}
</div>
