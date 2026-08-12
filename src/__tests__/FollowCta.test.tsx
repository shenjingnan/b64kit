// @vitest-environment happy-dom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FollowCta } from '@/components/FollowCta';
import { render } from '@/test/render';

const NOT_FOLLOWING: ToySDK.AuthorRelationResp = {
  status: 'ok',
  data: {
    isFollowing: false,
    isAuthor: false,
    isOldFan: false,
    hasFanMedal: false,
    isCharging: false,
  },
};

const FOLLOWING: ToySDK.AuthorRelationResp = {
  status: 'ok',
  data: {
    isFollowing: true,
    isAuthor: false,
    isOldFan: false,
    hasFanMedal: false,
    isCharging: false,
  },
};

const PROFILE: ToySDK.AuthorProfileResp = {
  status: 'ok',
  data: {
    nickname: '示例UP主',
    avatar: '//example.com/avatar.png',
    sign: '',
    following: 0,
    follower: 0,
    archiveCount: 0,
  },
};

function stubToy(relation: ToySDK.AuthorRelationResp, profile: ToySDK.AuthorProfileResp = PROFILE) {
  const toy = {
    getAuthorRelation: vi.fn(),
    getAuthorProfile: vi.fn(),
    navigate: vi.fn(),
  };
  window.toy = toy as unknown as ToySDK.Toy;
  vi.mocked(toy.getAuthorRelation).mockResolvedValue(relation);
  vi.mocked(toy.getAuthorProfile).mockResolvedValue(profile);
  vi.mocked(toy.navigate).mockResolvedValue(undefined);
  return toy;
}

afterEach(() => {
  window.toy = undefined as unknown as ToySDK.Toy;
  vi.restoreAllMocks();
});

describe('FollowCta 关注引导', () => {
  it('SDK 不可用（window.toy 未挂载）时静默隐藏', () => {
    render(<FollowCta />);
    expect(screen.queryByRole('button', { name: '去关注' })).not.toBeInTheDocument();
  });

  it('未关注 UP 主时展示关注按钮', async () => {
    stubToy(NOT_FOLLOWING);
    render(<FollowCta />);
    expect(await screen.findByRole('button', { name: '去关注' })).toBeInTheDocument();
  });

  it('已关注 UP 主时不展示关注按钮', async () => {
    const toy = stubToy(FOLLOWING);
    render(<FollowCta />);
    await waitFor(() => expect(toy.getAuthorRelation).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '去关注' })).not.toBeInTheDocument();
  });

  it('作者本人访问时不展示关注按钮', async () => {
    const toy = stubToy({
      status: 'ok',
      data: {
        isFollowing: false,
        isAuthor: true,
        isOldFan: false,
        hasFanMedal: false,
        isCharging: false,
      },
    });
    render(<FollowCta />);
    await waitFor(() => expect(toy.getAuthorRelation).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '去关注' })).not.toBeInTheDocument();
  });

  it('未登录（unauthorized）时视为未关注，展示关注按钮', async () => {
    stubToy({ status: 'unauthorized' });
    render(<FollowCta />);
    expect(await screen.findByRole('button', { name: '去关注' })).toBeInTheDocument();
  });

  it('展示作者头像与昵称组合的关注提示文案', async () => {
    stubToy(NOT_FOLLOWING, PROFILE);
    render(<FollowCta />);

    expect(await screen.findByText('示例UP主：求关注~拜托拜托~')).toBeInTheDocument();
    const avatar = screen.getByRole('img', { name: '示例UP主 的头像' });
    // 协议相对地址会归一化为 https
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('作者资料获取失败时回退到默认文案', async () => {
    const toy = stubToy(NOT_FOLLOWING);
    vi.mocked(toy.getAuthorProfile).mockRejectedValue(new Error('[ToySDK] profile failed'));
    render(<FollowCta />);

    expect(await screen.findByText('关注 UP 主，求关注~拜托拜托~')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('关系查询失败（非 ok）时不展示关注按钮', async () => {
    const toy = stubToy({ status: 'unsupported' });
    render(<FollowCta />);
    await waitFor(() => expect(toy.getAuthorRelation).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '去关注' })).not.toBeInTheDocument();
  });

  it('点击关注按钮通过 toy.navigate 跳转到 UP 主个人空间', async () => {
    const toy = stubToy(NOT_FOLLOWING);
    const user = userEvent.setup();
    render(<FollowCta />);

    await user.click(await screen.findByRole('button', { name: '去关注' }));

    expect(toy.navigate).toHaveBeenCalledWith({ type: 'space', id: '24615859' });
  });

  it('navigate 失败时回退为 window.open 打开个人空间', async () => {
    const toy = stubToy(NOT_FOLLOWING);
    vi.mocked(toy.navigate).mockRejectedValue(new Error('[ToySDK] navigate failed'));
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();
    render(<FollowCta />);

    await user.click(await screen.findByRole('button', { name: '去关注' }));

    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(
        'https://space.bilibili.com/24615859',
        '_blank',
        'noopener'
      )
    );
  });

  it('页面重新获得焦点后重新检测关注状态，已关注则隐藏按钮', async () => {
    const toy = stubToy(NOT_FOLLOWING);
    render(<FollowCta />);
    await screen.findByRole('button', { name: '去关注' });

    // 模拟用户去关注后返回，焦点事件触发重新检测
    vi.mocked(toy.getAuthorRelation).mockResolvedValue(FOLLOWING);
    window.dispatchEvent(new Event('focus'));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '去关注' })).not.toBeInTheDocument()
    );
  });

  it('页面重新可见（visibilitychange）后重新检测关注状态', async () => {
    const toy = stubToy(NOT_FOLLOWING);
    render(<FollowCta />);
    await screen.findByRole('button', { name: '去关注' });

    vi.mocked(toy.getAuthorRelation).mockResolvedValue(FOLLOWING);
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '去关注' })).not.toBeInTheDocument()
    );
  });
});
