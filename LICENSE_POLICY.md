# License policy / 许可证政策

## Current source / 当前源码

All project-authored source, functional configuration, and documentation in the current version are licensed under `GPL-3.0-only`. This includes `index.html`, `styles.css`, `app.js`, and `.nojekyll`. Standard license texts and the separately identified visual asset remain governed by their own terms. The unmodified GPL text is in [LICENSE](LICENSE).

当前版本的全部项目原创源码、功能配置和文档均采用 `GPL-3.0-only`，包括 `index.html`、`styles.css`、`app.js` 和 `.nojekyll`。标准许可证正文及下方单独登记的视觉资源继续适用其各自条款。未经修改的 GPL 正文见 [LICENSE](LICENSE)。

The current site intentionally has no build step or third-party runtime dependency: the files served to a browser are also the preferred form for modification.

当前网站有意不设置构建步骤，也没有第三方运行依赖；浏览器实际加载的文件同时就是修改时使用的首选源码形式。

## Effective boundary / 生效边界

Commit `1b0e7ccbe673459366caf5405b3d255b5ba21b4d` and earlier copies contained only a generated/minified deployment snapshot with no accompanying license or corresponding preferred-form source. This policy does not retroactively license that snapshot or any third-party code embedded in it. GPL-3.0-only applies to the replacement source from the commit that first adds this policy forward.

提交 `1b0e7ccbe673459366caf5405b3d255b5ba21b4d` 及更早副本只有生成/压缩后的部署快照，没有随附许可证或对应的首选修改源码。本政策不会追溯授权该快照或其中嵌入的第三方代码；`GPL-3.0-only` 自首次加入本政策并替换源码的提交起向后适用。

## Visual assets / 视觉资源

`preview.png` is not covered by the GPL. It is assigned to `LicenseRef-EeryFrank-Assets-Permission-Required`; see [ASSET_LICENSE.md](ASSET_LICENSE.md).

`preview.png` 不适用 GPL，而采用 `LicenseRef-EeryFrank-Assets-Permission-Required`；详见 [ASSET_LICENSE.md](ASSET_LICENSE.md)。

| File | SHA-256 | License |
| --- | --- | --- |
| `preview.png` | `754AAF3BB7905B5D882AF5D70781DE5BD67E06D06D5FE394A2999F968B5DF74A` | `LicenseRef-EeryFrank-Assets-Permission-Required` |

Future project-owned art, audio, logos, and branding use the same permission-required default unless a file-specific notice says otherwise. Third-party material always retains its original terms.

今后新增的项目自有美术、音频、Logo 与品牌资源，除非逐文件声明另有说明，同样默认须事先取得授权。第三方内容始终保留其原条款。
