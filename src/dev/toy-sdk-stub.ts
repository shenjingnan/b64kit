/**
 * 本地开发预览用的 Toy SDK 桩（仅开发模式生效）。
 *
 * 真实 Toy 环境（B站 App / Web）的 `window.toy` 由 index.html 中引入的
 * toy-sdk.js 提供；本地普通浏览器拿不到可用结果，故由 main.tsx 在开发模式下
 * 覆盖注入本桩，便于调试关注引导的展示与跳转。生产构建中 `import.meta.env.DEV`
 * 为 false，本模块会被 tree-shake 掉，不影响线上行为。
 *
 * 预览提示：
 * - 将 `STUB_FOLLOWING` 改为 `true` 可预览「已关注 → 不展示横幅」的效果。
 * - 关注检测 / 重新聚焦检测的逻辑由单元测试覆盖（src/__tests__/FollowCta.test.tsx）。
 */
const STUB_FOLLOWING = false;

/** 开发模式下覆盖 `window.toy`，返回"未关注"的假数据。 */
export function installToySdkStub() {
  window.toy = {
    isSupport: async () => true,
    getAuthorRelation: async (): Promise<ToySDK.AuthorRelationResp> => ({
      status: 'ok',
      data: {
        isFollowing: STUB_FOLLOWING,
        isAuthor: false,
        isOldFan: false,
        hasFanMedal: false,
        isCharging: false,
      },
    }),
    getAuthorProfile: async (): Promise<ToySDK.AuthorProfileResp> => ({
      status: 'ok',
      data: {
        nickname: 'b64kit',
        avatar:
          'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2796%27 height=%2796%27%3E%3Ccircle cx=%2748%27 cy=%2748%27 r=%2748%27 fill=%27%23ffffff%27/%3E%3Ctext x=%2748%27 y=%2761%27 font-size=%2748%27 text-anchor=%27middle%27 fill=%27%23fb7299%27%3EB%3C/text%3E%3C/svg%3E',
        sign: '',
        following: 0,
        follower: 0,
        archiveCount: 0,
      },
    }),
    navigate: async (req: ToySDK.NavigateReq) => {
      if (req.type === 'space') {
        window.open(`https://space.bilibili.com/${req.id}`, '_blank', 'noopener');
        return;
      }
      window.open(`https://www.bilibili.com/${req.id}`, '_blank', 'noopener');
    },
  } as unknown as ToySDK.Toy;
}
