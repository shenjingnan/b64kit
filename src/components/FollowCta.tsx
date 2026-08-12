import { UserPlus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/** 需要引导用户关注的 UP 主 mid（当前 Toy 作者，SDK 不暴露作者 mid，故硬编码）。 */
const UP_MID = '24615859';
const UP_SPACE_URL = `https://space.bilibili.com/${UP_MID}`;

type FollowState = 'checking' | 'show' | 'hidden';

interface AuthorInfo {
  nickname?: string;
  avatar?: string;
}

/** SDK 头像地址已归一化为 https，这里对协议相对地址（`//xxx`）做兜底。 */
function toAbsoluteUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}

/**
 * 关注引导条：检测当前用户是否已关注 UP 主，
 * 未关注时在顶部 tab 下方展示「去关注」按钮，点击跳转 UP 主个人空间。
 *
 * - 基于 `toy.getAuthorRelation()`，该能力固定返回当前用户与当前 Toy 作者的关注关系。
 * - 左侧通过 `toy.getAuthorProfile()` 展示作者头像与昵称，组合成关注提示文案。
 * - 页面重新获得焦点（用户操作后返回）时重新检测，关注后自动隐藏。
 * - SDK 不可用（`window.toy` 未挂载）或状态无法判定时静默隐藏。
 */
export function FollowCta() {
  const [state, setState] = useState<FollowState>('checking');
  const [author, setAuthor] = useState<AuthorInfo>({});
  const checkingRef = useRef(false);

  const checkFollow = useCallback(async () => {
    if (typeof window.toy === 'undefined') {
      setState('hidden');
      return;
    }
    if (checkingRef.current) {
      return;
    }
    checkingRef.current = true;
    try {
      const resp = await window.toy.getAuthorRelation();
      // 未登录时必然未关注，直接展示关注引导
      if (resp.status === 'unauthorized') {
        setState('show');
        return;
      }
      // 其余非 ok 状态（unsupported / denied 等）无法判定关注状态，按隐藏处理
      if (resp.status !== 'ok' || resp.data === undefined) {
        setState('hidden');
        return;
      }
      const { isAuthor, isFollowing } = resp.data;
      setState(isAuthor || isFollowing ? 'hidden' : 'show');
    } catch {
      setState('hidden');
    } finally {
      checkingRef.current = false;
    }
  }, []);

  const loadAuthorProfile = useCallback(async () => {
    if (typeof window.toy === 'undefined') {
      return;
    }
    try {
      const resp = await window.toy.getAuthorProfile();
      if (resp.status === 'ok' && resp.data !== undefined) {
        setAuthor({
          nickname: resp.data.nickname,
          avatar: toAbsoluteUrl(resp.data.avatar),
        });
      }
    } catch {
      // 作者资料获取失败时使用默认文案，不影响关注引导
    }
  }, []);

  useEffect(() => {
    void checkFollow();
    void loadAuthorProfile();

    const onFocus = () => {
      void checkFollow();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkFollow();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [checkFollow, loadAuthorProfile]);

  if (state !== 'show') {
    return null;
  }

  const handleFollow = async () => {
    if (typeof window.toy === 'undefined') {
      window.open(UP_SPACE_URL, '_blank', 'noopener');
      return;
    }
    try {
      await window.toy.navigate({ type: 'space', id: UP_MID });
    } catch {
      window.open(UP_SPACE_URL, '_blank', 'noopener');
    }
  };

  const prompt = author.nickname
    ? `${author.nickname}：求关注~拜托拜托~`
    : '关注 UP 主，求关注~拜托拜托~';

  return (
    <Card size="sm" className="bg-[#fb7299] ring-[#fb7299] text-white">
      <CardContent className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          {author.avatar !== undefined ? (
            <img
              src={author.avatar}
              alt={`${author.nickname ?? 'UP主'} 的头像`}
              className="size-6 shrink-0 rounded-full ring-2 ring-white/60"
            />
          ) : (
            <UserPlus className="size-4 shrink-0" />
          )}
          <span className="truncate">{prompt}</span>
        </span>
        <Button
          size="lg"
          className="bg-white px-6 text-[#fb7299] hover:bg-white/90 hover:text-[#fb7299]"
          onClick={() => void handleFollow()}
        >
          去关注
        </Button>
      </CardContent>
    </Card>
  );
}
